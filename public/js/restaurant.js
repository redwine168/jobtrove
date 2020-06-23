
const {HospitalID, HospitalName} = Qs.parse(location.search, { ignoreQueryPrefix: true });
console.log(HospitalName);