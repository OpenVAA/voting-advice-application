// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from "../utils/constants";

export const getData = async (endpoint: string): Promise<any> => {
    try{
        const url = `${constants.BACKEND_URL}/${endpoint}`;
        return await fetch(url).then(response => {
            return response.json();
        })
    }
    catch(err){
        console.log("Error: ", err);
    }
};