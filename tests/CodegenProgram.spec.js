import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.locator('body').click();
  await page.goto('https://www.google.com/sorry/index?continue=https://www.google.com/search%3Fq%3Dgoogle%26oq%3Dgoogle%26gs_lcrp%3DEgZjaHJvbWUyBggAEEUYOdIBCDMxMzlqMGoyqAIAsAIB%26sourceid%3Dchrome%26ie%3DUTF-8%26sei%3D80rBaOuZN_GaseMP6qfpsA8&q=EhAkCUDCEhPA5dSMMsIHnQTBGPSVhcYGIjAgDknCBYpCWpOcV3D4emu1-v3Z9Rknq9FmXN_qKJLLROJuQewglBZPf1RGoBWJ0uUyAVJaAUM');
  
  await page.getByRole('link', { name: 'Google Google https://www.' }).click();
  await page.getByRole('combobox', { name: 'Search' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('orangehrmdemo');
  await page.getByLabel('orangehrm demo', { exact: true }).getByText('orangehrm demo').click();
  await page.getByRole('link', { name: 'OrangeHRM Demo OrangeHRM' }).click();
  await page.getByRole('img', { name: 'company-branding' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('Admin');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('banner').getByText('Dashboard Hari').click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
});