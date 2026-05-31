async (page) => {
    console.log("Testing evaluation inside workspace");
    await page.goto("https://www.example.com");
    return await page.title();
}
