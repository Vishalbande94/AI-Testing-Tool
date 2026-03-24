const{test,expect}=require('@playwright/test')

test("Verify application url",async function({page}){
await page.goto("https://www.google.com/")

const url=await page.url()
const title=await page.title()



console.log("Page url is:-"+url)
console.log("Page title is:-"+title)
await expect(page).toHaveTitle("Google")



})