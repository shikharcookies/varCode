import pandas as pd
from flask import request
from devops_cloud_native_dbd.configs.config import s3_connector

JENKINS_MIG_DATA_FILE_NAME = "jenkins_migration/cloud_native_inventory.csv"

DISPLAY_COLUMNS = [
    "Tribe",
    "Current Ecosystem",
    "Target ecosystem",
    "Component",
    "Type",
    "Programming Language",
    "Status",
    "Jenkins Migration?",
    "Migration Status"
]

def parse_param(name):
    val = request.args.get(name)
    if not val or not val.strip():
        return []
    return [v.strip() for v in val.split(",") if v.strip()]

def get_jenkins_mig_data():
    if not s3_connector.has_file(JENKINS_MIG_DATA_FILE_NAME):
        raise FileNotFoundError("The S3 file does not exist.")
    
    df = s3_connector.read_csv_file(JENKINS_MIG_DATA_FILE_NAME)
    # Remove unnamed columns
    df = df.loc[:, ~df.columns.str.contains('unnamed', case=False)]
    
    # Parse URL parameters
    tribes = parse_param("tribe")
    currents = parse_param("current_ecosystem")
    targets = parse_param("target_ecosystem")
    
    # Apply filters
    if tribes:
        df = df[df["Tribe"].isin(tribes)]
    if currents:
        df = df[df["Current Ecosystem"].isin(currents)]
    if targets:
        df = df[df["Target ecosystem"].isin(targets)]
        
    # Select only available columns from DISPLAY_COLUMNS
    available_cols = [c for c in DISPLAY_COLUMNS if c in df.columns]
    df = df[available_cols]
    
    # Rename specific column for clarity
    df = df.rename(columns={"Jenkins Migration?": "Scope for Jenkins Migration"})
    
    return df

def get_jenkins_migration_sunburst_data():
    df = get_jenkins_mig_data()
    
    if df.empty:
        return []
    
    # ---------------------------
    # STATUS ORDER
    # ---------------------------
    status_order = [
        "Completed",
        "Blocked",
        "Deprecated",
        "Done",
        "Not Started",
        "Out-of-Scope",
    ]
    
    # ---------------------------
    # ALLOWED LANGUAGES
    # ---------------------------
    language_order = [
        "C#",
        "Java",
        "JavaScript",
        "Python",
    ]
    
    # ---------------------------
    # CLEAN ECOSYSTEM
    # ---------------------------
    df["Current Ecosystem"] = (
        df["Current Ecosystem"]
        .astype(str)
        .str.strip()
        .str.upper()
    )
    
    # Fix inconsistent naming
    df["Current Ecosystem"] = df["Current Ecosystem"].replace(
        {"RISKREPORTING": "RISKREPORTING"}
    )
    
    df = df[df["Current Ecosystem"] != ""]
    df = df[df["Current Ecosystem"].notna()]
    
    # ---------------------------
    # CLEAN PROGRAMMING LANGUAGE
    # ---------------------------
    df["Programming Language"] = (
        df["Programming Language"]
        .astype(str)
        .str.strip()
    )
    
    df = df[df["Programming Language"].isin(language_order)]
    
    # ---------------------------
    # CLEAN MIGRATION STATUS
    # ---------------------------
    df["Migration Status"] = (
        df["Migration Status"]
        .astype(str)
        .str.strip()
    )
    
    df = df[df["Migration Status"].isin(status_order)]
    
    # ---------------------------
    # KEEP REQUIRED COLUMNS
    # ---------------------------
    df = df[
        [
            "Current Ecosystem",
            "Programming Language",
            "Migration Status",
        ]
    ]
    
    # ---------------------------
    # GROUP DATA
    # ---------------------------
    grouped_df = (
        df.groupby(
            ["Current Ecosystem", "Programming Language", "Migration Status"]
        )
        .size()
        .reset_index(name="Count")
    )
    
    # ---------------------------
    # SORT BY SIZE (important for better sunburst layout)
    # ---------------------------
    grouped_df = grouped_df.sort_values(
        ["Current Ecosystem", "Programming Language", "Count"],
        ascending=[True, True, False],
    )
    
    # ---------------------------
    # PIVOT TABLE
    # ---------------------------
    pivot_df = grouped_df.pivot_table(
        index=["Current Ecosystem", "Programming Language"],
        columns="Migration Status",
        values="Count",
        aggfunc="sum",
        fill_value=0,
    )
    
    # ---------------------------
    # ENSURE ALL STATUS COLUMNS EXIST
    # ---------------------------
    for status in status_order:
        if status not in pivot_df.columns:
            pivot_df[status] = 0
            
    # Reorder status columns
    pivot_df = pivot_df[status_order]
    
    # Reset index
    pivot_df = pivot_df.reset_index()
    
    return pivot_df.to_dict(orient="records")


def get_teamcity_pool_distribution():
    FILE_NAME = "jenkins_migration/TeamCity_agent_pools.csv"

    if not s3_connector.has_file(FILE_NAME):
        raise FileNotFoundError("The S3 file does not exist.")

    df = s3_connector.read_csv_file(FILE_NAME)

    # -------------------------
    # CLEAN COLUMN NAMES
    # -------------------------
    df.columns = df.columns.str.strip()

    # -------------------------
    # VALIDATE COLUMNS
    # -------------------------
    if "Pool ID" not in df.columns or "Agent ID" not in df.columns:
        raise KeyError("Required columns not found: Pool ID / Agent ID")

    # -------------------------
    # CLEAN DATA
    # -------------------------
    df["Pool ID"] = df["Pool ID"].astype(str).str.strip()
    df["Agent ID"] = df["Agent ID"].astype(str).str.strip()

    df = df[(df["Pool ID"] != "") & (df["Agent ID"] != "")]

    # -------------------------
    # GROUP
    # -------------------------
    result_df = (
        df.groupby("Pool ID")["Agent ID"]
        .count()
        .reset_index(name="Agents")
    )

    # Sort (better visualization)
    result_df = result_df.sort_values("Agents", ascending=False)

    return result_df