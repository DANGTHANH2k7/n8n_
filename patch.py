import json

file_path = "/Users/dangthanh/Downloads/n8n_/n8n/postvisit_parse_intake_from_sheet.workflow.json"
with open(file_path, "r") as f:
    data = json.load(f)

# 1. Modify "Normalize Parsed Result" node
for node in data.get("nodes", []):
    if node.get("name") == "Normalize Parsed Result":
        old_code = node["parameters"]["jsCode"]
        new_code = old_code.replace("let source = $json;", "let source = {};\nconst splitItems = $items('Split Intake One By One');\nif (splitItems && splitItems.length > 0) {\n    source = splitItems[0].json;\n}")
        node["parameters"]["jsCode"] = new_code

# 2. Modify connections
connections = data.get("connections", {})

# Fix Parse Error? routing
if "Parse Error?" in connections:
    # Ensure index 1 (False) ONLY goes to Append Structured Visit
    connections["Parse Error?"]["main"][1] = [
        {
            "node": "Append Structured Visit",
            "type": "main",
            "index": 0
        }
    ]

# Add Append Reminders -> Update Intake Status
connections["Append Reminders"] = {
    "main": [
        [
            {
                "node": "Update Intake Status",
                "type": "main",
                "index": 0
            }
        ]
    ]
}

# Add Append Patient Questions -> Update Intake Status
connections["Append Patient Questions"] = {
    "main": [
        [
            {
                "node": "Update Intake Status",
                "type": "main",
                "index": 0
            }
        ]
    ]
}

with open(file_path, "w") as f:
    json.dump(data, f, indent=2)

