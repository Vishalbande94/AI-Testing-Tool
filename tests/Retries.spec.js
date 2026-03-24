const { test, expect } = require('@playwright/test');

test("Verify Google Search works", async ({ page }) => {
  await page.goto("https://www.google.com/");

  const url = page.url();
  const title = await page.title();

  console.log("Page URL is: " + url);
  console.log("Page Title is: " + title);

  await expect(page).toHaveTitle("Google");

  // Type in the search box
  const searchInput = page.locator('input[name="q"]');
  await searchInput.fill("iphone");

  // Press Enter to search (Google uses Enter instead of a regular button)
  await searchInput.press("Enter");

  // Wait for search results to appear
  const results = page.locator('#search');
  await expect(results).toBeVisible();

  // Optionally, assert that at least one result contains the word "iPhone"
  const firstResult = results.locator('h3').first();
  await expect(firstResult).toContainText("iPhone");
});
