async (page) => {
    await page.goto("https://www.example.com");
    await page.screenshot({ path: 'c:/Users/Kd singh/Desktop/AI2xBlueprint/Project_05_AI_Jobassistant/LinkDINWithMCP/output/test_screenshot.png' });
    return "Screenshot taken";
}
