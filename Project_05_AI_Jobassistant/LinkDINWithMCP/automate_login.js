async (page) => {
    const username = "singhkd332@gmail.com";
    const password = "test@2225";
    const outputDir = "c:/Users/Kd singh/Desktop/AI2xBlueprint/Project_05_AI_Jobassistant/LinkDINWithMCP/output";
    
    console.log("Navigating to LinkedIn login page...");
    await page.goto("https://www.linkedin.com/login");
    
    console.log("Waiting for username input field...");
    await page.waitForSelector("#username", { timeout: 10000 });
    
    console.log("Filling credentials...");
    await page.fill("#username", username);
    await page.fill("#password", password);
    
    console.log("Clicking sign in...");
    await page.click("button[type='submit']");
    
    // Wait for the URL to change to the feed or dashboard (indicating successful login)
    // or look for verification/OTP screens.
    console.log("Waiting for navigation to feed...");
    let loggedIn = false;
    for (let i = 0; i < 45; i++) {
        const url = page.url();
        if (url.includes("/feed") || url.includes("/jobs") || url.includes("/mynetwork")) {
            loggedIn = true;
            break;
        }
        // Check if there is a security check / pin page
        const isSecurity = url.includes("checkpoint") || await page.locator("input[name='pin']").count() > 0 || await page.locator("#input-pin").count() > 0;
        if (isSecurity) {
            console.log("Security verification detected! Please enter the code in the browser if headful, or we will wait for you to bypass it. URL:", url);
        }
        await page.waitForTimeout(1000);
    }
    
    // Take screenshot of whatever page we are on
    const loginScreenshotPath = `${outputDir}/login_success.png`;
    await page.screenshot({ path: loginScreenshotPath });
    
    return JSON.stringify({
        loggedIn,
        currentUrl: page.url(),
        screenshotPath: loginScreenshotPath
    }, null, 2);
}
