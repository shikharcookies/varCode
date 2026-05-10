from teamcity_inventory_dbd.configs.config import s3_connector
from flask import request
import pandas as pd


DISPLAY_COLUMNS = [
    "Tribe",
    "Current Ecosystem",
    "Target Ecosystem",
    "Teamcity Project Name",
    "Teamcity Project ID",
    "Build Name",
    "Build ID",
    "Build URL",
    "Build Type",
    "Tranch",
    "Sprint",
    "In Scope(Y/N)",
    "Migration Status",
]


# ---------------------------------------------------
# DYNAMIC FILE SELECTION BASED ON MONTH DROPDOWN
# ---------------------------------------------------
def get_inventory_file_name():

    selected_month = request.args.get("month", "May")

    file_mapping = {
        "April": "teamcity_inventory/TeamcityBuildInventory_28-04-2026.csv",
        "May": "teamcity_inventory/TeamcityBuildInventory_07-05-2026.csv",
    }

    return file_mapping.get(
        selected_month,
        "teamcity_inventory/TeamcityBuildInventory_07-05-2026.csv"
    )


# ---------------------------------------------------
# PARAM PARSER
# ---------------------------------------------------
def parse_param(name):

    val = request.args.get(name)

    if not val or not val.strip():
        return []

    return [v.strip() for v in val.split(",") if v.strip()]


# ---------------------------------------------------
# MAIN DATA LOADER
# ---------------------------------------------------
def get_teamcity_inventory_data():

    file_name = get_inventory_file_name()

    if not s3_connector.has_file(file_name):
        raise FileNotFoundError("The s3 file does not exist.")

    df = s3_connector.read_csv_file(file_name)

    # Remove unnamed columns
    df = df.loc[:, ~df.columns.str.contains("unnamed", case=False)]

    # Clean column names
    df.columns = df.columns.str.strip()

    # -------------------------
    # FILTER PARAMETERS
    # -------------------------
    tribes = parse_param("tribe")
    currents = parse_param("current_ecosystem")
    targets = parse_param("target_ecosystem")
    statuses = parse_param("migration_status")
    build_types = parse_param("build_type")
    sprint_number = parse_param("sprint_number")

    # -------------------------
    # APPLY FILTERS
    # -------------------------
    if tribes:
        df = df[df["Tribe"].isin(tribes)]

    if currents:
        df = df[df["Current Ecosystem"].isin(currents)]

    if targets:
        df = df[df["Target Ecosystem"].isin(targets)]

    if statuses:
        df = df[df["Migration Status"].isin(statuses)]

    if build_types:
        df = df[df["Build Type"].isin(build_types)]

    if sprint_number:
        df = df[df["Sprint"].isin(sprint_number)]

    # -------------------------
    # KEEP REQUIRED COLUMNS
    # -------------------------
    available_cols = [
        c for c in DISPLAY_COLUMNS if c in df.columns
    ]

    df = df[available_cols]

    # Rename for UI clarity
    df = df.rename(
        columns={
            "In Scope(Y/N)": "In Scope?"
        }
    )

    return df


# ---------------------------------------------------
# SUNBURST DATA
# ---------------------------------------------------
def get_teamcity_inventory_sunburst_data():

    df = get_teamcity_inventory_data()

    if df.empty:
        return []

    status_order = [
        "Completed",
        "In-Progress",
        "Not Started",
        "Out-of-Scope",
        "Deprecated",
        "Archived",
        "Blocked",
    ]

    build_type_order = [
        "CD",
        "CI",
    ]

    # -------------------------
    # CLEAN ECOSYSTEM
    # -------------------------
    df["Current Ecosystem"] = (
        df["Current Ecosystem"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[df["Current Ecosystem"] != ""]
    df = df[df["Current Ecosystem"].notna()]

    # -------------------------
    # CLEAN BUILD TYPE
    # -------------------------
    df["Build Type"] = (
        df["Build Type"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[
        df["Build Type"].isin(build_type_order)
    ]

    # -------------------------
    # CLEAN STATUS
    # -------------------------
    df["Migration Status"] = (
        df["Migration Status"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Migration Status"].isin(status_order)
    ]

    # -------------------------
    # KEEP REQUIRED COLUMNS
    # -------------------------
    df = df[
        [
            "Current Ecosystem",
            "Build Type",
            "Migration Status",
        ]
    ]

    # -------------------------
    # GROUP
    # -------------------------
    grouped_df = (
        df.groupby(
            [
                "Current Ecosystem",
                "Build Type",
                "Migration Status",
            ]
        )
        .size()
        .reset_index(name="Count")
    )

    # -------------------------
    # SORT
    # -------------------------
    grouped_df = grouped_df.sort_values(
        [
            "Current Ecosystem",
            "Build Type",
            "Count",
        ],
        ascending=[True, True, False],
    )

    # -------------------------
    # PIVOT
    # -------------------------
    pivot_df = grouped_df.pivot_table(
        index=[
            "Current Ecosystem",
            "Build Type",
        ],
        columns="Migration Status",
        values="Count",
        aggfunc="sum",
        fill_value=0,
    )

    # Ensure all status columns exist
    for status in status_order:
        if status not in pivot_df.columns:
            pivot_df[status] = 0

    pivot_df = pivot_df[status_order]

    pivot_df = pivot_df.reset_index()

    return pivot_df.to_dict(orient="records")


# ---------------------------------------------------
# STACKED BAR CHART
# ---------------------------------------------------
def get_teamcity_active_builds_by_type():

    df = get_teamcity_inventory_data()

    if df.empty:
        return []

    build_type_order = ["CI", "CD"]

    # -------------------------
    # CLEAN BUILD TYPE
    # -------------------------
    df["Build Type"] = (
        df["Build Type"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[df["Build Type"].isin(build_type_order)]

    # -------------------------
    # CLEAN TRIBE
    # -------------------------
    df["Tribe"] = (
        df["Tribe"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[df["Tribe"] != ""]
    df = df[df["Tribe"].notna()]

    # -------------------------
    # GROUP
    # -------------------------
    grouped_df = (
        df.groupby(["Tribe", "Build Type"])
        .size()
        .reset_index(name="Count")
    )

    # -------------------------
    # PIVOT
    # -------------------------
    pivot_df = grouped_df.pivot_table(
        index="Tribe",
        columns="Build Type",
        values="Count",
        aggfunc="sum",
        fill_value=0,
    )

    # Ensure both columns exist
    for build_type in build_type_order:
        if build_type not in pivot_df.columns:
            pivot_df[build_type] = 0

    pivot_df = pivot_df[build_type_order]

    pivot_df = pivot_df.reset_index()

    return pivot_df.to_dict(orient="records")

# ---------------------------------------------------
# LINE CHART - BUILD TREND BY TRIBE
# ---------------------------------------------------
def get_teamcity_build_trend_by_tribe():

    month_files = {
        "April": "teamcity_inventory/TeamcityBuildInventory_28-04-2026.csv",
        "May": "teamcity_inventory/TeamcityBuildInventory_07-05-2026.csv",
    }

    selected_build_type = request.args.get(
        "build_type",
        "All"
    )

    final_df = pd.DataFrame()

    for month, file_name in month_files.items():

        if not s3_connector.has_file(file_name):
            continue

        df = s3_connector.read_csv_file(file_name)

        # -----------------------------------------
        # REMOVE UNNAMED COLUMNS
        # -----------------------------------------
        df = df.loc[
            :,
            ~df.columns.str.contains(
                "unnamed",
                case=False
            )
        ]

        # -----------------------------------------
        # CLEAN COLUMN NAMES
        # -----------------------------------------
        df.columns = df.columns.str.strip()

        # -----------------------------------------
        # CLEAN BUILD TYPE
        # -----------------------------------------
        df["Build Type"] = (
            df["Build Type"]
            .astype(str)
            .str.strip()
            .str.upper()
        )

        # -----------------------------------------
        # APPLY BUILD TYPE FILTER
        # -----------------------------------------
        if selected_build_type.upper() != "ALL":

            df = df[
                df["Build Type"] ==
                selected_build_type.upper()
            ]

        # -----------------------------------------
        # CLEAN TRIBE
        # -----------------------------------------
        df["Tribe"] = (
            df["Tribe"]
            .astype(str)
            .str.strip()
            .str.upper()
        )

        df = df[df["Tribe"] != ""]
        df = df[df["Tribe"].notna()]

        # -----------------------------------------
        # GROUP DATA
        # -----------------------------------------
        grouped_df = (
            df.groupby("Tribe")
            .size()
            .reset_index(name="Count")
        )

        grouped_df["Month"] = month

        final_df = pd.concat(
            [final_df, grouped_df],
            ignore_index=True
        )

    if final_df.empty:
        return []

    # -----------------------------------------
    # PIVOT TABLE
    # -----------------------------------------
    pivot_df = final_df.pivot_table(
        index="Month",
        columns="Tribe",
        values="Count",
        aggfunc="sum",
        fill_value=0,
    )

    pivot_df = pivot_df.reset_index()

    return pivot_df.to_dict(orient="records")