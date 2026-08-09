const fromCodepoints = value => value.split('-').map(codepoint => String.fromCodePoint(parseInt(codepoint, 16))).join('');

const definitions = [
  ['happy-outline', '1F600', 'grinning happy smile', require('../../assets/emojis/happy-outline.png')], ['happy', '1F604', 'happy smile joy', require('../../assets/emojis/happy.png')],
  ['heart', '2764-FE0F', 'heart love', require('../../assets/emojis/heart.png')], ['heart-outline', '1F496', 'heart love', require('../../assets/emojis/heart-outline.png')],
  ['thumbs-up', '1F44D', 'thumbs up like yes', require('../../assets/emojis/thumbs-up.png')], ['thumbs-down', '1F44E', 'thumbs down dislike no', require('../../assets/emojis/thumbs-down.png')],
  ['hand-left-outline', '1F44B', 'wave hello', require('../../assets/emojis/hand-left-outline.png')], ['star-outline', '2728', 'sparkles celebrate', require('../../assets/emojis/star-outline.png')],
  ['star', '2B50', 'star favourite favorite', require('../../assets/emojis/star.png')], ['sunny-outline', '2600-FE0F', 'sun sunshine', require('../../assets/emojis/sunny-outline.png')],
  ['moon-outline', '1F319', 'moon night', require('../../assets/emojis/moon-outline.png')], ['rainy-outline', '1F327-FE0F', 'rain weather', require('../../assets/emojis/rainy-outline.png')],
  ['flower-outline', '1F338', 'flower blossom', require('../../assets/emojis/flower-outline.png')], ['leaf-outline', '1F33F', 'leaf nature', require('../../assets/emojis/leaf-outline.png')],
  ['flame-outline', '1F525', 'fire hot', require('../../assets/emojis/flame-outline.png')], ['water-outline', '1F4A7', 'water drop', require('../../assets/emojis/water-outline.png')],
  ['chatbubble-outline', '1F4AC', 'chat speech message', require('../../assets/emojis/chatbubble-outline.png')], ['mail-outline', '2709-FE0F', 'mail letter', require('../../assets/emojis/mail-outline.png')],
  ['gift-outline', '1F381', 'gift present', require('../../assets/emojis/gift-outline.png')], ['color-palette-outline', '1F388', 'balloon party', require('../../assets/emojis/color-palette-outline.png')],
  ['musical-notes-outline', '1F3B5', 'music note song', require('../../assets/emojis/musical-notes-outline.png')], ['camera-outline', '1F4F7', 'camera photo', require('../../assets/emojis/camera-outline.png')],
  ['images-outline', '1F5BC-FE0F', 'image picture', require('../../assets/emojis/images-outline.png')], ['book-outline', '1F4DA', 'book read', require('../../assets/emojis/book-outline.png')],
  ['rocket-outline', '1F680', 'rocket launch', require('../../assets/emojis/rocket-outline.png')], ['airplane-outline', '2708-FE0F', 'plane travel', require('../../assets/emojis/airplane-outline.png')],
  ['car-outline', '1F697', 'car drive', require('../../assets/emojis/car-outline.png')], ['home-outline', '1F3E0', 'home house', require('../../assets/emojis/home-outline.png')],
  ['people-outline', '1F465', 'people friends community', require('../../assets/emojis/people-outline.png')], ['person-outline', '1F642', 'person face', require('../../assets/emojis/person-outline.png')],
  ['paw-outline', '1F43E', 'paw animal', require('../../assets/emojis/paw-outline.png')], ['restaurant-outline', '1F37D-FE0F', 'food meal', require('../../assets/emojis/restaurant-outline.png')],
  ['cafe-outline', '2615', 'coffee cafe', require('../../assets/emojis/cafe-outline.png')], ['wine-outline', '1F942', 'drink cheers', require('../../assets/emojis/wine-outline.png')],
  ['football-outline', '26BD', 'football soccer sport', require('../../assets/emojis/football-outline.png')], ['game-controller-outline', '1F3AE', 'game play', require('../../assets/emojis/game-controller-outline.png')],
  ['bulb-outline', '1F4A1', 'idea light', require('../../assets/emojis/bulb-outline.png')], ['checkmark-circle-outline', '2705', 'check yes done', require('../../assets/emojis/checkmark-circle-outline.png')],
  ['alert-circle-outline', '2757', 'alert important', require('../../assets/emojis/alert-circle-outline.png')], ['help-circle-outline', '2753', 'question help', require('../../assets/emojis/help-circle-outline.png')],
];

export const EMOJIS = definitions.map(([id, codepoints, keywords, image]) => ({ id, unicode: fromCodepoints(codepoints), value: fromCodepoints(codepoints), keywords, image }));
export const EMOJI_BY_ALIAS = new Map(EMOJIS.map(emoji => [emoji.id, emoji]));
export const EMOJI_BY_UNICODE = new Map(EMOJIS.map(emoji => [emoji.unicode, emoji]));
