async (page) => {
    const url = page.url();
    const title = await page.title();
    await page.screenshot({ path: 'c:/Users/Kd singh/Desktop/AI2xBlueprint/Project_05_AI_Jobassistant/LinkDINWithMCP/output/login_success.png' });
    return JSON.stringify({ url, title }, null, 2);
}
