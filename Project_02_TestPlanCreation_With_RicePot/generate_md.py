import extract

markdown_content = "# API Test Plan\n\n"

for endpoint, cases in extract.test_cases.items():
    markdown_content += f"## {endpoint}\n\n"
    markdown_content += "| TID | Scenario | TestCase Description | PreCondition | Expected Result | Priority | Is Automated |\n"
    markdown_content += "|---|---|---|---|---|---|---|\n"
    
    for tc in cases:
        # Sanitize text for markdown tables (replace newlines with spaces or <br>)
        desc = tc.get("TestCase Description", "").replace("\n", " ")
        pre = tc.get("PreCondition", "").replace("\n", " ")
        expected = tc.get("Expected Result", "").replace("\n", " ")
        
        row = f"| {tc.get('TID', '')} | {tc.get('Scenario', '')} | {desc} | {pre} | {expected} | {tc.get('Priority', '')} | {tc.get('Is Automated', '')} |\n"
        markdown_content += row
        
    markdown_content += "\n---\n\n"

with open("API_TestPlan.md", "w", encoding="utf-8") as f:
    f.write(markdown_content)

print("Markdown file API_TestPlan.md generated successfully!")
