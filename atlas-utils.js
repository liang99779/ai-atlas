(function(root){
 'use strict';
 const taxonomyCache=new WeakMap();
 function categoryMap(data){if(!taxonomyCache.has(data))taxonomyCache.set(data,new Map(data.categories.map(c=>[c.id,c])));return taxonomyCache.get(data);}
 function categoryMatches(data,product,id){
  if(!id)return true;
  const requested=data.legacyCategories?.[id]||[id];
  const ids=Array.isArray(requested)?requested:[requested];
  const map=categoryMap(data);
  for(let current of productPurposes(product)){
   const visited=new Set();
   while(current&&!visited.has(current)){
    if(ids.includes(current))return true;
    visited.add(current);current=map.get(current)?.parent;
   }
  }
  return false;
 }
 function productPurposes(product){return product?[...new Set([product.categoryId,...(product.secondaryCategoryIds||[])].filter(id=>typeof id==='string'&&id))]:[];}
 function commonPurposes(products){
  if(!products.length||products.some(p=>!p?.kind||p.kind!==products[0]?.kind))return [];
  return productPurposes(products[0]).filter(id=>products.every(p=>productPurposes(p).includes(id)));
 }
 function canCompare(a,b){return !!a&&!!b&&commonPurposes([a,b]).length>0;}
 function comparisonState(products,purpose=''){
  if(products.length<2)return {error:'too-few',common:[]};
  if(products.length>3)return {error:'too-many',common:[]};
  if(products.some(p=>!p?.kind||p.kind!==products[0]?.kind))return {error:'different-types',common:[]};
  const common=commonPurposes(products);
  if(!common.length)return {error:'no-common-purpose',common};
  if(purpose&&!common.includes(purpose))return {error:'invalid-purpose',common};
  if(!purpose&&common.length>1)return {error:'choose-purpose',common};
  return {error:null,common,purpose:purpose||common[0]};
 }
 function filterProducts(data,query,index){
  const words=(query.get('q')||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return data.products.filter(p=>words.every(w=>(index.get(p.id)||'').includes(w))&&categoryMatches(data,p,query.get('category'))&&(!query.get('industry')||p.industryTags.includes(query.get('industry')))&&(!query.get('kind')||p.kind===query.get('kind'))&&(!query.get('open')||p.openness.label===query.get('open'))&&(!query.get('price')||p.pricing.mode===query.get('price'))&&(!query.get('cap')||p.capabilities.includes(query.get('cap'))));
 }
 function pageNumbers(current,total){return [...new Set([1,current-1,current,current+1,total])].filter(n=>n>0&&n<=total).sort((a,b)=>a-b);}
 const api={categoryMatches,productPurposes,commonPurposes,comparisonState,canCompare,filterProducts,pageNumbers};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AtlasUtils=api;
})(typeof window!=='undefined'?window:globalThis);
