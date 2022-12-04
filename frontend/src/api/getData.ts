// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import {constants} from "../utils/constants";

// TODO: Define what type of data this returns instead of just any
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

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = async (): Promise<any> => {
    return await getData('api/candidates?populate=*').then(result => {
        return result?.data
    })
}