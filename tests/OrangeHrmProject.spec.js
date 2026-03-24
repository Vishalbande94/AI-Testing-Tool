const{test,expect}=require('@playwright/test')

test.use({viewport:{width:1280,height:672}})

test.skip("VerifyLogin",async function({page}){

   await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")
   await page.locator("input[name='username']").type("Admin",{delay:400})
   await page.locator("input[name='password']").fill("admin123")
   await page.locator("button[type='submit']").click()
   await expect(page).toHaveURL(/dashboard/)
   await page.getByAltText("profile picture").click()
   await page.getByText("Logout").click()
   await expect(page).toHaveURL(/login/)
})
test("VerifyLoginValidation",async function({page}){
console.log(page.viewportSize().width)
console.log(page.viewportSize().height)
   await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")
   await page.locator("input[name='username']").type("Admin",{delay:200})
   await page.locator("input[name='password']").fill("admin1234")
   await page.locator("button[type='submit']").click()
   const error=await page.locator("p[class='oxd-text oxd-text--p oxd-alert-content-text']").textContent()
   console.log("Validation error mesage for wrong credential:-"+error)
   await expect(error.includes("Invalid")).toBeTruthy()
   await expect (error==="Invalid credentials").toBeTruthy()
   
})