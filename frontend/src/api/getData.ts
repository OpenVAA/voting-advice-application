// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)
export const getData = async (endpoint: string): Promise<any> => {
    try{
        const url = `${import.meta.env.VITE_BACKEND_URL}/${endpoint}`;
        return await fetch(url).then(response => {
            return response.json();
        })
    }
    catch(err){
        console.log("Error: ", err);
    }
};