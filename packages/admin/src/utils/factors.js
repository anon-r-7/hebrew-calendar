export const getFactors = (n) => {
	const nearestWholeNumber = Math.round(n)

  if (nearestWholeNumber <= 0) return [];
  
  const factors = new Set();
  
  for (let i = 1; i <= Math.sqrt(nearestWholeNumber); i++) {
    if (nearestWholeNumber % i === 0) {
      factors.add(i);
      factors.add(nearestWholeNumber / i);
    }
  }
  
  return Array.from(factors).sort((a, b) => a - b);	
}