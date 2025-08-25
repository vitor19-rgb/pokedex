// Seletores para os elementos HTML
const pokemonName = document.querySelector('.pokemon__name');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonImage = document.querySelector('.pokemon__image');
const infoBox = document.querySelector('.pokemon-info-box');
const pokemonTypes = document.querySelector('.pokemon__types span');
const pokemonDescription = document.querySelector('.pokemon__description span');
const pokemonLocation = document.querySelector('.pokemon__location span');
const buttonEvolution = document.querySelector('.btn-evolution');

const form = document.querySelector('.form');
const input = document.querySelector('.input__search');
const buttonPrev = document.querySelector('.btn-prev');
const buttonNext = document.querySelector('.btn-next');

let searchPokemon = 1;
let nextEvolutionName = null;

// Função genérica e otimizada para buscar da API
const fetchAPI = async (url) => {
  const response = await fetch(url);
  if (response.status === 200) return response.json();
}

// Função principal para renderizar o Pokémon
const renderPokemon = async (pokemon) => {
  const isEvolving = pokemonImage.classList.contains('evolving');

  if (!isEvolving) {
    pokemonImage.style.display = 'none';
  }
  infoBox.style.display = 'none';
  pokemonName.innerHTML = 'Loading...';
  pokemonNumber.innerHTML = '';
  
  nextEvolutionName = null;

  const data = await fetchAPI(`https://pokeapi.co/api/v2/pokemon/${pokemon.toString().toLowerCase()}`);

  if (data) {
    const [speciesData, encounterData] = await Promise.all([
      fetchAPI(`https://pokeapi.co/api/v2/pokemon-species/${data.id}`),
      fetchAPI(`https://pokeapi.co/api/v2/pokemon/${data.id}/encounters`)
    ]);

    infoBox.style.display = 'flex';
    pokemonImage.style.display = 'block';
    pokemonName.innerHTML = data.name;
    pokemonNumber.innerHTML = data.id;
    searchPokemon = data.id;
    input.value = '';

    const types = data.types.map(typeInfo => typeInfo.type.name);
    pokemonTypes.innerHTML = `Tipo: ${types.join(' | ')}`;
    pokemonLocation.innerHTML = (encounterData && encounterData.length > 0) ? `Local: ${encounterData[0].location_area.name.replace(/-/g, ' ')}` : 'Local: Não encontrado na natureza.';

    if (speciesData) {
      const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
      pokemonDescription.innerHTML = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f]/g, ' ') : 'Descrição não disponível.';
      
      const evolutionChainResponse = await fetchAPI(speciesData.evolution_chain.url);
      let currentStage = evolutionChainResponse.chain;
      while (currentStage && currentStage.species.name !== data.name) {
        currentStage = currentStage.evolves_to[0];
      }
      if (currentStage && currentStage.evolves_to.length > 0) {
        nextEvolutionName = currentStage.evolves_to[0].species.name;
      }
    }

    const gen5Sprite = data.sprites.versions['generation-v']['black-white'].animated.front_default;
    const animatedSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${data.id}.gif`;
    const staticSprite = data.sprites.other['official-artwork'].front_default;
    pokemonImage.src = gen5Sprite || animatedSprite || staticSprite;
    pokemonImage.onerror = () => { pokemonImage.src = staticSprite; };

  } else {
    pokemonImage.style.display = 'none';
    pokemonName.innerHTML = 'Não encontrado :c';
    pokemonNumber.innerHTML = '';
  }
}

// Event Listener para o botão de evolução (COM A LÓGICA DE TRANSIÇÃO)
buttonEvolution.addEventListener('click', () => {
  if (nextEvolutionName) {
    if (pokemonImage.classList.contains('evolving')) return;

    pokemonImage.classList.add('evolving');

    // Espera a animação de "fade out" terminar
    setTimeout(() => {
      // Remove a classe para parar a animação
      pokemonImage.classList.remove('evolving');
      // Chama a função para carregar o novo Pokémon
      renderPokemon(nextEvolutionName);
    }, 800); // 0.8 segundos (duração da animação evolve-transform)
  } else {
    alert('Este Pokémon não possui mais evoluções!');
  }
});

// Outros Event Listeners
form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderPokemon(input.value);
});
buttonPrev.addEventListener('click', () => {
  if (searchPokemon > 1) {
    searchPokemon -= 1;
    renderPokemon(searchPokemon);
  }
});
buttonNext.addEventListener('click', () => {
  searchPokemon += 1;
  renderPokemon(searchPokemon);
});

// Inicia a Pokédex
renderPokemon(searchPokemon);