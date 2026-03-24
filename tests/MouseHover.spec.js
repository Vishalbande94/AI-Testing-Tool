const{test,expect}=require('@playwright/test')

test('Mouse hover',async function ({page}){
    await page.goto("https://practice.expandtesting.com/tooltips")
    await page.locator("xpath=//button[@id='btn1']").hover()
    await page.waitForTimeout(2000)
     await page.screenshot({ path: 'hover-screenshot.png' });
    

})