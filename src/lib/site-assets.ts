import type { ImageSourcePropType } from 'react-native';
export const SITE_URL = 'https://kbr-fresh-foods-kanishka.vercel.app';
const bundled: Record<string, ImageSourcePropType> = {
"/kbr-logo.png": require("../../assets/site/kbr-logo.png"),
"/cat_banana.png": require("../../assets/site/cat_banana.png"),
"/cat_fruit.png": require("../../assets/site/cat_fruit.png"),
"/cat_vegetable.png": require("../../assets/site/cat_vegetable.png"),
"/cat_others.png": require("../../assets/site/cat_others.png"),
"/images/fruits.png": require("../../assets/site/images/fruits.png"),
"/images/farm.png": require("../../assets/site/images/farm.png"),
"/images/harvest.png": require("../../assets/site/images/harvest.png"),
"/images/lab.png": require("../../assets/site/images/lab.png"),
"/images/delivery.png": require("../../assets/site/images/delivery.png"),
"/blog_1.png": require("../../assets/site/blog_1.png"),
"/blog_2.png": require("../../assets/site/blog_2.png"),
"/blog_3.png": require("../../assets/site/blog_3.png"),
"/team/kanishka.jpg": require("../../assets/site/team/kanishka.jpg"),
"/team/buddhika.jpg": require("../../assets/site/team/buddhika.jpg"),
"/team/ravindra.jpg": require("../../assets/site/team/ravindra.jpg"),
"/team/sithara.jpg": require("../../assets/site/team/sithara.jpg"),
"/region_nuwara_eliya.png": require("../../assets/site/region_nuwara_eliya.png"),
"/region_dambulla.png": require("../../assets/site/region_dambulla.png"),
"/region_anuradhapura.png": require("../../assets/site/region_anuradhapura.png")
};
export function siteImage(value: string): ImageSourcePropType { return bundled[value] || { uri: value.startsWith('/') ? SITE_URL + value : value }; }
