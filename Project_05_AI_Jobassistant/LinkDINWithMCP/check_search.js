async (page) => {
    const outputDir = "c:/Users/Kd singh/Desktop/AI2xBlueprint/Project_05_AI_Jobassistant/LinkDINWithMCP/output";
    
    console.log("Navigating to QA jobs with Easy Apply filter...");
    await page.goto("https://www.linkedin.com/jobs/search/?keywords=QA&f_AL=true", { waitUntil: "domcontentloaded" });
    
    // Wait for jobs list or search results to load
    console.log("Waiting for job listings to appear...");
    await page.waitForTimeout(5000); // Wait for page to load and API responses
    
    // Let's take a screenshot
    const searchScreenshotPath = `${outputDir}/search_results.png`;
    await page.screenshot({ path: searchScreenshotPath });
    
    // Let's scrape some basic information to verify we see job cards
    const jobCards = await page.locator(".jobs-search-results-list__list-item, [data-occludable-job-id]").all();
    const jobs = [];
    for (let i = 0; i < Math.min(jobCards.length, 5); i++) {
        const card = jobCards[i];
        const title = await card.locator(".job-card-list__title, .base-search-card__title").first().innerText().catch(() => "N/A");
        const company = await card.locator(".job-card-container__company-name, .base-search-card__subtitle").first().innerText().catch(() => "N/A");
        jobs.push({ index: i, title: title.trim(), company: company.trim() });
    }
    
    return JSON.stringify({
        url: page.url(),
        jobCardsCount: jobCards.length,
        jobs
    }, null, 2);
}
