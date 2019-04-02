export default async function createAds(adsObj){
    console.log(`/api/createAds?bankName=${adsObj.bankName}&dynamicPrice=${adsObj.dynamicPrice}&minOrder=${adsObj.minOrder}&maxOrder=${adsObj.maxOrder}&price=${adsObj.price}&name=${adsObj.name}&accountNo=${adsObj.accountNo}&state=${adsObj.state}&country=${adsObj.country}&city=${adsObj.city}`)
    const response = await fetch(`/api/createAds?bankName=${adsObj.bankName}&dynamicPrice=${adsObj.dynamicPrice}&minOrder=${adsObj.minOrder}&maxOrder=${adsObj.maxOrder}&price=${adsObj.price}&name=${adsObj.name}&accountNo=${adsObj.accountNo}&state=${adsObj.state}&country=${adsObj.country}&city=${adsObj.city}`)
    

    const result = await response.json()
    console.log("createAds", result)
    return result;
}