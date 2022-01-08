
const { Card } = require('./card');
const { shuffle } = require('./rand');

/**
 * @private
 * @type {Map.<Deck, Object>}
 */
const props = new WeakMap();

/**
 * @private
 * @type {Set.<string>}
 */
const piles = new Set([ 'deck', 'discard', 'held' ]);

/**
 * @class Deck
 * @param cards {Card[]}
 */
class Deck {
	constructor(cards = [ ]) {
		props.set(this, {
			cards: new Set(cards),
			deck: cards.slice(),
			held: [ ],
			discard: [ ]
		});

		// Assign each card to the deck
		cards.forEach((card) => {
			card.deck = this;
		});
	}

	/**
	 * @type {number}
	 * @description The total number of cards belonging to this deck
	 */
	get totalLength() {
		return props.get(this).cards.size;
	}

	/**
	 * @type {number}
	 * @description The current number of cards remaining in the deck pile
	 */
	get remainingLength() {
		return props.get(this).deck.length;
	}

	/**
	 * @type {Card[]}
	 * @description Copy of the array of cards in held pile
	 */
	get held() {
		return props.get(this).discard.slice();
	}

	/**
	 * @type {Card[]}
	 * @description Copy of the array of cards in discard pile
	 */
	get discarded() {
		return props.get(this).discard.slice();
	}

	/**
	 * Add a new card to the deck, placing it in the given pile
	 *
	 * @param card {Card}
	 * @param pile {'deck'|'discard'|'held'}
	 * @return void
	 */
	add(card, pile = 'deck') {
		if (! piles.has(pile)) {
			throw new Error(`Deck: cannot add card to unknown pile "${pile}"`);
		}

		const _props = props.get(this);

		card.deck = this;

		_props.cards.add(card);
		_props[pile].push(card);
	}

	/**
	 * Removes a card from the deck entirely
	 *
	 * @param card {Card}
	 * @return void
	 */
	remove(card) {
		const { cards, deck, discard, held } = props.get(this);

		cards.delete(card);
		remove(deck, card);
		remove(discard, card);
		remove(held, card);

		card.deck = null;
	}
	
	/**
	 * Merge the given Deck into this one, moving all cards belonging to the given Deck into this Deck.
	 *
	 * @param deck {Deck}
	 * @param pile {'deck'|'discard'|'pile'}
	 * @return void
	 */
	merge(deck, pile = 'deck') {
		const { cards } = props.get(deck);
		
		cards.forEach((card) => {
			deck.remove(card);
			this.add(card, pile);
		});
	}

	/**
	 * Draw the given number of cards, places them in the held pile, and returns the drawn cards
	 *
	 * @param count {number}
	 * @return {Card[]}
	 */
	draw(count = 1) {
		const { deck, held } = props.get(this);

		if (! deck.length) {
			throw new Error('Deck: Cannot draw from deck, no cards remaining');
		}

		if (count < 0) {
			return [ ];
		}

		const cards = deck.splice(0, count);

		held.push(...cards);

		return cards;
	}

	/**
	 * Draw the given number of cards from the bottom of the deck, places them in the held pile,
	 * and returns the drawn cards
	 *
	 * @param count {number}
	 * @return {Card[]}
	 */
	drawFromBottom(count = 1) {
		const { deck, held } = props.get(this);

		if (! deck.length) {
			throw new Error('Deck: Cannot draw from deck, no cards remaining');
		}

		if (count < 0) {
			return [ ];
		}

		const start = Math.max(deck.length - count, 0);
		const cards = deck.splice(start, count).reverse();

		held.push(...cards);

		return cards;
	}

	/**
	 * Draws the given number of cards, places them in the discard pile, and returns the drawn cards
	 *
	 * @param count {number}
	 * @return {Card[]}
	 */
	drawToDiscard(count = 1) {
		const { deck, discard } = props.get(this);

		if (! deck.length) {
			throw new Error('Deck: Cannot draw from deck, no cards remaining');
		}

		if (count < 0) {
			return [ ];
		}

		const cards = deck.splice(0, count);

		discard.push(...cards);

		return cards;
	}

	/**
	 * Draw the given number of cards from the bottom of the deck, places them in the discard pile,
	 * and returns the drawn cards
	 *
	 * @param count {number}
	 * @return {Card[]}
	 */
	drawToDiscardFromBottom(count = 1) {
		const { deck, discard } = props.get(this);

		if (! deck.length) {
			throw new Error('Deck: Cannot draw from deck, no cards remaining');
		}

		if (count < 0) {
			return [ ];
		}

		const start = Math.max(deck.length - count, 0);
		const cards = deck.splice(start, count).reverse();

		discard.push(...cards);

		return cards;
	}

	/**
	 * Moves the given card into the discard pile
	 *
	 * @param card {Card|Card[]}
	 * @return {void}
	 */
	discard(card) {
		if (Array.isArray(card)) {
			return card.forEach((card) => this.discard(card));
		}

		if (! (card instanceof Card)) {
			throw new Error('Deck: Value provided is not a Card instance');
		}

		const { cards, deck, held, discard } = props.get(this);

		if (! cards.has(card)) {
			throw new Error('Deck: Provided card does not belong to this deck');
		}

		const deckIndex = deck.indexOf(card);

		if (deckIndex >= 0) {
			deck.splice(deckIndex, 1);
			discard.push(card);
		}

		else {
			const heldIndex = held.indexOf(card);

			if (heldIndex >= 0) {
				held.splice(heldIndex, 1);
				discard.push(card);
			}
		}
	}

	/**
	 * Finds the given card and returns an object representing its current location (pile, and index in that pile)
	 *
	 * @param card {Card}
	 * @return {{ pile: 'deck'|'discard'|'held', index: number, card: Card }}
	 */
	locateCard(card) {
		if (! (card instanceof Card)) {
			throw new Error('Value provided is not a Card instance');
		}

		const { cards, deck, held, discard } = props.get(this);

		if (! cards.has(card)) {
			throw new Error('Provided card does not belong to this deck');
		}

		const deckIndex = deck.indexOf(card);

		if (deckIndex >= 0) {
			return {
				pile: 'deck',
				index: deckIndex,
				card
			};
		}

		const heldIndex = held.indexOf(card);

		if (heldIndex >= 0) {
			return {
				pile: 'held',
				index: heldIndex,
				card
			};
		}

		const discardIndex = discard.indexOf(card);

		if (discardIndex >= 0) {
			return {
				pile: 'discard',
				index: discardIndex,
				card
			};
		}

		// This should never happen
		throw new Error('Failed to find the given card');
	}

	/**
	 * Moves all cards back to the deck and shuffles the deck
	 *
	 * @return {void}
	 */
	shuffleAll() {
		const { deck, held, discard } = props.get(this);

		deck.push(...held);
		deck.push(...discard);

		held.length = 0;
		discard.length = 0;

		shuffle(deck);
	}

	/**
	 * Shuffles the cards remaining in the deck
	 *
	 * @return {void}
	 */
	shuffleRemaining() {
		shuffle(props.get(this).deck);
	}

	/**
	 * Shuffles the cards in the discard pile and then places them at the end of the deck
	 *
	 * @return {void}
	 */
	shuffleDiscard() {
		const { deck, discard } = props.get(this);

		shuffle(discard);

		deck.push(...discard);

		discard.length = 0;
	}

	/**
	 * Moves all cards in the discard back to the deck and shuffles the deck
	 *
	 * @return {void}
	 */
	shuffleDeckAndDiscard() {
		const { deck, discard } = props.get(this);

		deck.push(...discard);

		discard.length = 0;

		shuffle(deck);
	}

	/**
	 * Moves all currently held cards to the discard pile
	 *
	 * @return {void}
	 */
	discardAllHeld() {
		const { held, discard } = props.get(this);

		discard.push(...held);

		held.length = 0;
	}

	/**
	 * Finds all cards in the deck matching the given filtering function
	 *
	 * ```javascript
	 * const aces = deck.findCards((card) => card.rank === ace);
	 * ```
	 *
	 * @param filter {function(Card):boolean}
	 * @return {Card[]}
	 */
	findCards(filter) {
		const matching = [ ];

		props.get(this).cards.forEach((card) => {
			if (filter(card)) {
				matching.push(card);
			}
		});

		return matching;
	}
}

exports.Deck = Deck;

const remove = (array, value) => {
	const index = array.indexOf(value);

	if (index >= 0) {
		array.splice(index, 1);
	}
};
