export default async function doLogin(loginObj){
    const response = await fetch(`/api/login?userEmail=${loginObj.email}&password=${loginObj.password}`)
    const result = await response.json()
    return result;
}