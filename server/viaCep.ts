/**
 * Integração com a API ViaCEP para busca de endereços
 * https://viacep.com.br/
 */

import { cleanCEP } from "../shared/validators";

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  stateCode: string;
  region: string;
  ibgeCode: string;
  ddd: string;
}

/**
 * Busca endereço pelo CEP usando a API ViaCEP
 * @param cep CEP com ou sem formatação
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  const cleanedCep = cleanCEP(cep);
  
  if (cleanedCep.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    
    if (!response.ok) {
      console.error(`[ViaCEP] HTTP error: ${response.status}`);
      return null;
    }
    
    const data: ViaCEPResponse = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return {
      cep: data.cep,
      street: data.logradouro || '',
      complement: data.complemento || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.estado || '',
      stateCode: data.uf || '',
      region: data.regiao || '',
      ibgeCode: data.ibge || '',
      ddd: data.ddd || '',
    };
  } catch (error) {
    console.error('[ViaCEP] Error fetching address:', error);
    return null;
  }
}
