import {getAllCandidates} from "../../api/getData";

export async function load(){
	return await getAllCandidates();

}
