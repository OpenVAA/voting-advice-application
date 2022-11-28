import {getData} from '../../api/getData';

export async function load(){
	return await getData('api/parties').then(result => {
		return result?.data
	})
}
