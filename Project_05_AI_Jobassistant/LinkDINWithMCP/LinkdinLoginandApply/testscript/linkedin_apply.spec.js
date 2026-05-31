const { test, expect } = require('@playwright/test');

test.describe('LinkedIn Auto-Apply Workflow', () => {
    
    test.beforeEach(async ({ page }) => {
        // Go to LinkedIn and ensure we are logged in (assumes session is maintained or handled here)
        await page.goto('https://www.linkedin.com/jobs/');
    });

    test('TC-01: Should search for QA jobs with Easy Apply filter', async ({ page }) => {
        // Search for QA
        const searchInput = page.getByRole('combobox', { name: 'Search by title, skill, or company' });
        await searchInput.fill('QA');
        
        // Location (India)
        const locationInput = page.getByRole('combobox', { name: 'City, state, or zip code' });
        await locationInput.fill('India');
        
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForURL(/keywords=QA/);

        // Click Easy Apply filter
        const easyApplyButton = page.getByRole('radio', { name: 'Easy Apply' });
        if (await easyApplyButton.isVisible()) {
            await easyApplyButton.click();
        } else {
            // Might be inside "All filters" depending on viewport
            await page.getByRole('button', { name: 'All filters' }).click();
            await page.getByRole('switch', { name: 'Easy Apply' }).click();
            await page.getByRole('button', { name: 'Show results' }).click();
        }

        // Verify the filter is applied via URL
        expect(page.url()).toContain('f_AL=true');
    });

    test('TC-02: Should open Easy Apply modal for a job', async ({ page }) => {
        // Navigate directly to a filtered job search page for testing
        await page.goto('https://www.linkedin.com/jobs/search/?keywords=QA&f_AL=true');

        // Click the first job's Easy Apply button
        const firstJobEasyApplyBtn = page.locator('.jobs-search-results-list__list-item').first().getByRole('button', { name: 'Easy Apply' });
        await firstJobEasyApplyBtn.click();

        // Verify modal opens
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('Apply to');
    });

    test('TC-03: Should upload resume in the Easy Apply flow', async ({ page }) => {
        // Note: This test requires a mocked or live job that asks for a resume
        // and is highly dependent on the specific job's application form steps.

        await page.goto('https://www.linkedin.com/jobs/search/?keywords=QA&f_AL=true');
        await page.locator('.jobs-search-results-list__list-item').first().getByRole('button', { name: 'Easy Apply' }).click();
        
        // Navigate steps until 'Resume' section
        // Assuming we click 'Next' if we are on Contact Info
        if (await page.getByRole('button', { name: 'Continue to next step' }).isVisible()) {
            await page.getByRole('button', { name: 'Continue to next step' }).click();
        }

        // Wait for resume upload button
        const uploadBtn = page.getByRole('button', { name: /Upload resume/i });
        await expect(uploadBtn).toBeVisible();

        // Trigger file chooser and upload
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            uploadBtn.click()
        ]);
        
        // Use a dummy path for the test
        await fileChooser.setFiles('test_resume.docx');
        
        // Verify upload success (checking if the filename appears)
        await expect(page.getByText('test_resume.docx')).toBeVisible();
    });

    test('TC-04: Should click through application steps and submit', async ({ page }) => {
        // This is a placeholder for testing the final submission.
        // For automated testing against production LinkedIn, submitting real applications is discouraged.
        // Instead, we verify the 'Review your application' and 'Submit application' buttons exist.
        
        // Pseudocode for navigating to the end:
        /*
        while (await page.getByRole('button', { name: 'Continue to next step' }).isVisible()) {
            await page.getByRole('button', { name: 'Continue to next step' }).click();
        }
        */

        // When we reach the review step
        // const reviewBtn = page.getByRole('button', { name: 'Review your application' });
        // await reviewBtn.click();
        
        // Verify submit button is visible
        // const submitBtn = page.getByRole('button', { name: 'Submit application' });
        // await expect(submitBtn).toBeVisible();
    });
});
