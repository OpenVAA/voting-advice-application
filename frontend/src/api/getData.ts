// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)
export const getData = async (url: string): Promise<any> => {
    try{
        return await fetch(url).then(response => {
            return response.json();
        })
    }
    catch(err){
        console.log("Error: ", err);
    }
};