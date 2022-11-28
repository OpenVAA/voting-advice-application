import {getData} from '../../api/getData';

export async function load(){
	return await getData('api/candidates?populate=*').then(result => {
		return result?.data
	})
}
