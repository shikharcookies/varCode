import os
from datetime import datetime

import pandas as pd

from teamcity.client import TeamCityClient
from teamcity.client.endpoints import projects
from teamcity.client.endpoints import builds

from teamcity_inventory_dbd.configs.config import (
    s3_connector,
)

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

TEAMCITY_URL = os.getenv("TEAMCITY_URL")
TEAMCITY_TOKEN = os.getenv("TEAMCITY_TOKEN")

S3_FOLDER = "teamcity_inventory"

# ---------------------------------------------------
# TEAMCITY CLIENT
# ---------------------------------------------------

client = TeamCityClient(
    server_url=TEAMCITY_URL,
    api_token=TEAMCITY_TOKEN,
    verify_ssl=True,
)

# ---------------------------------------------------
# FETCH TEAMCITY DATA
# ---------------------------------------------------

def fetch_teamcity_inventory():

    inventory_rows = []

    # -----------------------------------------
    # GET ALL PROJECTS
    # -----------------------------------------

    all_projects = projects.get_projects(
        client,
        count=5000,
    )

    for project in all_projects.get("project", []):

        project_id = project.get("id")
        project_name = project.get("name")

        try:

            build_configs = (
                builds.get_builds(
                    client,
                    project_id=project_id,
                    count=5000,
                )
            )

            for build in build_configs.get("build", []):

                build_name = build.get("buildTypeId", "N/A")

                build_id = build.get("id", "N/A")

                build_url = build.get("webUrl", "N/A")

                # ----------------------------
                # DETERMINE BUILD TYPE
                # ----------------------------

                build_name_upper = str(build_name).upper()

                if "CI" in build_name_upper:
                    build_type = "CI"

                elif "CD" in build_name_upper:
                    build_type = "CD"

                else:
                    build_type = "N/A"

                inventory_rows.append(
                    {
                        "Project Name": project_name,
                        "Project ID": project_id,
                        "Build Name": build_name,
                        "Build ID": build_id,
                        "Build URL": build_url,
                        "Build Type": build_type,
                    }
                )

        except Exception as e:

            print(
                f"Failed for project {project_name}: {str(e)}"
            )

    return pd.DataFrame(inventory_rows)

# ---------------------------------------------------
# SAVE CSV
# ---------------------------------------------------

def save_inventory_csv(df):

    current_date = datetime.now().strftime(
        "%d-%m-%Y"
    )

    file_name = (
        f"TeamcityBuildInventory_{current_date}.csv"
    )

    local_path = os.path.join(
        "/tmp",
        file_name,
    )

    df.to_csv(
        local_path,
        index=False,
    )

    return local_path, file_name

# ---------------------------------------------------
# UPLOAD TO S3
# ---------------------------------------------------

def upload_inventory_to_s3(
    local_path,
    file_name,
):

    s3_path = f"{S3_FOLDER}/{file_name}"

    with open(local_path, "rb") as f:

        s3_connector.upload_fileobj(
            file_obj=f,
            s3_file_name=s3_path,
        )

    return s3_path

# ---------------------------------------------------
# MAIN EXECUTION
# ---------------------------------------------------

def generate_and_upload_inventory():

    print("Fetching TeamCity inventory...")

    df = fetch_teamcity_inventory()

    print(
        f"Fetched {len(df)} build configurations"
    )

    local_path, file_name = save_inventory_csv(df)

    print(f"CSV generated: {file_name}")

    s3_path = upload_inventory_to_s3(
        local_path,
        file_name,
    )

    print(f"Uploaded to S3: {s3_path}")

    return {
        "status": "success",
        "rows": len(df),
        "s3_path": s3_path,
    }