from flask import request
import pandas as pd

from teamcity_inventory_dbd.configs.config import (
    s3_connector,
)

# ---------------------------------------------------------
# OPTIONAL IMPORT
# ---------------------------------------------------------
# This is the new monthly inventory generation job.
#
# It fetches fresh TeamCity inventory data,
# generates a CSV file,
# and uploads it to S3 automatically.
#
# IMPORTANT:
# If this import causes issues during deployment,
# simply comment/remove:
#
# from teamcity_inventory_dbd.data_setters.teamcity_data_setter import (
#     generate_and_upload_inventory,
# )
#
# and ALSO comment/remove:
#
# def run_teamcity_inventory_job():
#     result = generate_and_upload_inventory()
#     return result
#
# The remaining existing dashboards/charts/APIs
# will continue to work normally.
# ---------------------------------------------------------

from teamcity_inventory_dbd.data_setters.teamcity_data_setter import (
    generate_and_upload_inventory,
)

# ---------------------------------------------------------
# FILE CONFIG
# ---------------------------------------------------------

TEAMCITY_INVENTORY_DATA_FILE_NAME = (
    "teamcity_inventory/TeamcityBuildInventory_07-05-2026.csv"
)

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

# ---------------------------------------------------------
# PARAM PARSER
# ---------------------------------------------------------

def parse_param(name):

    val = request.args.get(name)

    if not val or not val.strip():
        return []

    return [
        v.strip()
        for v in val.split(",")
        if v.strip()
    ]

# ---------------------------------------------------------
# MAIN INVENTORY DATA
# ---------------------------------------------------------

def get_teamcity_inventory_data():

    if not s3_connector.has_file(
        TEAMCITY_INVENTORY_DATA_FILE_NAME
    ):
        raise FileNotFoundError(
            "The S3 file does not exist."
        )

    df = s3_connector.read_csv_file(
        TEAMCITY_INVENTORY_DATA_FILE_NAME
    )

    # Remove unnamed columns
    df = df.loc[
        :,
        ~df.columns.str.contains(
            "unnamed",
            case=False,
        ),
    ]

    # -----------------------------------------------------
    # URL PARAM FILTERS
    # -----------------------------------------------------

    tribes = parse_param("tribe")

    currents = parse_param(
        "current_ecosystem"
    )

    targets = parse_param(
        "target_ecosystem"
    )

    statuses = parse_param(
        "migration_status"
    )

    build_types = parse_param(
        "build_type"
    )

    sprint_number = parse_param(
        "sprint_number"
    )

    # -----------------------------------------------------
    # APPLY FILTERS
    # -----------------------------------------------------

    if tribes:
        df = df[
            df["Tribe"].isin(tribes)
        ]

    if currents:
        df = df[
            df["Current Ecosystem"].isin(
                currents
            )
        ]

    if targets:
        df = df[
            df["Target Ecosystem"].isin(
                targets
            )
        ]

    if statuses:
        df = df[
            df["Migration Status"].isin(
                statuses
            )
        ]

    if build_types:
        df = df[
            df["Build Type"].isin(
                build_types
            )
        ]

    if sprint_number:
        df = df[
            df["Sprint"].isin(
                sprint_number
            )
        ]

    # -----------------------------------------------------
    # KEEP AVAILABLE COLUMNS ONLY
    # -----------------------------------------------------

    available_cols = [
        c
        for c in DISPLAY_COLUMNS
        if c in df.columns
    ]

    df = df[available_cols]

    # -----------------------------------------------------
    # RENAME COLUMN
    # -----------------------------------------------------

    df = df.rename(
        columns={
            "In Scope(Y/N)": "In Scope?"
        }
    )

    return df

# ---------------------------------------------------------
# SUNBURST DATA
# ---------------------------------------------------------

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

    # -----------------------------------------------------
    # CLEAN ECOSYSTEM
    # -----------------------------------------------------

    df["Current Ecosystem"] = (
        df["Current Ecosystem"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df["Current Ecosystem"] = (
        df["Current Ecosystem"].replace(
            {
                "RISKREPORTING": "RISKREPORTING"
            }
        )
    )

    df = df[
        df["Current Ecosystem"] != ""
    ]

    df = df[
        df["Current Ecosystem"].notna()
    ]

    # -----------------------------------------------------
    # CLEAN BUILD TYPE
    # -----------------------------------------------------

    df["Build Type"] = (
        df["Build Type"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Build Type"].isin(
            build_type_order
        )
    ]

    # -----------------------------------------------------
    # CLEAN STATUS
    # -----------------------------------------------------

    df["Migration Status"] = (
        df["Migration Status"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Migration Status"].isin(
            status_order
        )
    ]

    # -----------------------------------------------------
    # KEEP REQUIRED COLUMNS
    # -----------------------------------------------------

    df = df[
        [
            "Tribe",
            "Current Ecosystem",
            "Build Type",
            "Migration Status",
        ]
    ]

    # -----------------------------------------------------
    # GROUP
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    grouped_df = grouped_df.sort_values(
        [
            "Current Ecosystem",
            "Build Type",
            "Count",
        ],
        ascending=[
            True,
            True,
            False,
        ],
    )

    # -----------------------------------------------------
    # PIVOT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # ENSURE ALL STATUS COLUMNS EXIST
    # -----------------------------------------------------

    for status in status_order:

        if status not in pivot_df.columns:
            pivot_df[status] = 0

    pivot_df = pivot_df[
        status_order
    ]

    pivot_df = pivot_df.reset_index()

    return pivot_df.to_dict(
        orient="records"
    )

# ---------------------------------------------------------
# ACTIVE BUILDS STACKED BAR DATA
# ---------------------------------------------------------

def get_teamcity_active_builds_by_type():

    """
    Returns:
    Tribe + Build Type + Count
    Used for stacked bar chart.
    """

    df = get_teamcity_inventory_data()

    if df.empty:
        return []

    build_type_order = [
        "CI",
        "CD",
    ]

    # -----------------------------------------------------
    # CLEAN BUILD TYPE
    # -----------------------------------------------------

    df["Build Type"] = (
        df["Build Type"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[
        df["Build Type"].isin(
            build_type_order
        )
    ]

    # -----------------------------------------------------
    # CLEAN TRIBE
    # -----------------------------------------------------

    df["Tribe"] = (
        df["Tribe"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    df = df[df["Tribe"] != ""]

    df = df[df["Tribe"].notna()]

    # -----------------------------------------------------
    # GROUP DATA
    # -----------------------------------------------------

    result = (
        df.groupby(
            [
                "Tribe",
                "Build Type",
            ]
        )
        .size()
        .reset_index(name="Count")
    )

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    result["Build Type"] = (
        pd.Categorical(
            result["Build Type"],
            categories=build_type_order,
            ordered=True,
        )
    )

    result = result.sort_values(
        [
            "Tribe",
            "Build Type",
        ]
    )

    return result.to_dict(
        orient="records"
    )

# ---------------------------------------------------------
# MONTHLY TEAMCITY INVENTORY JOB
# ---------------------------------------------------------
# This API triggers:
#
# 1. Fetch TeamCity inventory
# 2. Generate CSV
# 3. Upload CSV to S3
#
# Can later be connected to:
# - Scheduler
# - Cron Job
# - Monthly automation
#
# SAFE ROLLBACK:
# If this feature creates deployment/runtime issues,
# simply comment/remove:
#
# from teamcity_inventory_dbd.data_setters.teamcity_data_setter import (
#     generate_and_upload_inventory,
# )
#
# and comment/remove this function below.
#
# Existing dashboards/APIs will still work perfectly.
# ---------------------------------------------------------

def run_teamcity_inventory_job():

    result = generate_and_upload_inventory()

    return result