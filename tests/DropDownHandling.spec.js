const {test,expect}=require('@playwright/test')

test('Select drop down',async function({page}){
     await page.goto("https://testautomationpractice.blogspot.com/")

// await page.locator('#country').selectOption({label:"Canada"})

//     await page.waitForTimeout(1000)
//     const value=await page.locator('#country').textContent()
//     console.log("ALl dropdown values are:-"+value)
//     await expect(value.includes('India')).toBeTruthy()
//     await expect(value.includes('pak')).toBeFalsy()
     let country=await page.$('#country')
     let allvalue=await country.$$('option')
     let ddstatus=false
     for(let i=0;i<allvalue.length;i++){
          let value=await allvalue[i].textContent()
          if(value.includes('India')){
               console.log("india is present:- "+value)
               ddstatus=true
               break
          }
           } await expect(ddstatus).toBeTruthy() 
})