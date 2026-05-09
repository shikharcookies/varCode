from teamcity_inventory_dbd.configs.config import s3_connector
from flask import request
import pandas as pd

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


def parse_param(name):
    val = request.args.get(name)

    if not val or not val.strip():
        return []

    return [v.strip() for v in val.split(",") if v.strip()]


def get_teamcity_inventory_data():

    if not s3_connector.has_file(TEAMCITY_INVENTORY_DATA_FILE_NAME):
        raise FileNotFoundError("The s3 file does not exist.")

    df = s3_connector.read_csv_file(
        TEAMCITY_INVENTORY_DATA_FILE_NAME
    )

    df = df.loc[:, ~df.columns.str.contains("unnamed", case=False)]

    tribes = parse_param("tribe")
    currents = parse_param("current_ecosystem")
    targets = parse_param("target_ecosystem")
    statuses = parse_param("migration_status")
    build_types = parse_param("build_type")
    sprint_number = parse_param("sprint_number")

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

    available_cols = [
        c for c in DISPLAY_COLUMNS if c in df.columns
    ]

    df = df[available_cols]

    df = df.rename(
        columns={
            "In Scope(Y/N)": "In Scope?"
        }
    )

    return df


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

    df = df[df["Current Ecosystem"] != ""]
    df = df[df["Current Ecosystem"].notna()]

    df["Build Type"] = (
        df["Build Type"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Build Type"].isin(build_type_order)
    ]

    df["Migration Status"] = (
        df["Migration Status"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["Migration Status"].isin(status_order)
    ]

    df = df[
        [
            "Tribe",
            "Current Ecosystem",
            "Build Type",
            "Migration Status",
        ]
    ]

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

    grouped_df = grouped_df.sort_values(
        [
            "Current Ecosystem",
            "Build Type",
            "Count",
        ],
        ascending=[True, True, False],
    )

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

    for status in status_order:
        if status not in pivot_df.columns:
            pivot_df[status] = 0

    pivot_df = pivot_df[status_order]

    pivot_df = pivot_df.reset_index()

    return pivot_df.to_dict(orient="records")


def get_teamcity_active_builds_by_type():
    """
    Get active TeamCity builds count grouped by build type (CI/CD).
    
    Parameters:
    - build_type: Filter by specific build type (CI or CD). If not provided, shows both.
    
    Returns:
    List of dicts with Build Type and Count for stacked bar chart.
    """
    
    df = get_teamcity_inventory_data()
    
    if df.empty:
        return []
    
    build_type_order = ["CI", "CD"]
    
    # Clean Build Type column
    df["Build Type"] = df["Build Type"].astype(str).str.strip()
    df = df[df["Build Type"].isin(build_type_order)]
    
    # Group by Build Type and count
    result = (
        df.groupby("Build Type")
        .size()
        .reset_index(name="Count")
    )
    
    # Sort by build type order
    result["Build Type"] = pd.Categorical(
        result["Build Type"],
        categories=build_type_order,
        ordered=True
    )
    result = result.sort_values("Build Type")
    
    return result.to_dict(orient="records")