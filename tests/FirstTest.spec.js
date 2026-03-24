const{test,expect}=require('@playwright/test')

test.skip("FirstTest",async function({page}){
expect(100).toBe(100)
})
test("secondtest",async function({page}){
expect(10*2).toBe(20)
})
test("thirdTest",async function({page}){
expect(20-10).toBe(30)
})
test("fourthTest",async function({page}){
expect("vishal bande".includes("vishal")).toBeTruthy()
})