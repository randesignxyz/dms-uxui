const image = name => `/products/${name}.png`
const item = (sku, name, nameKh, category, price, imageName, unit = 'piece', packSize = 1, stock = 0) => ({
  sku, name, nameKh, category, price, image: image(imageName), unit, packSize, stock,
  orderable: sku !== null && price !== null,
  maxQty: null,
  incrementQty: 1,
  uomId: sku !== null && unit === 'piece' ? 2 : null,
  pack: unit === 'case' ? `${packSize} pieces / case` : 'Single piece'
})

// Prices are the numbers provided by the user, displayed as USD in this preview.
// Case photos were not supplied, so case SKUs use their matching piece image.
export const catalog = [
  item('OMK1003', 'Chilli Sauce 250g', 'ទឹកម្ទេសវ័នម៉រ 250ក្រាម', 'Chilli sauce', 0.75, 'omk-chili-sauce-250g', 'piece', 1, 180),
  item('OMK1003-24', 'Chilli Sauce 250g × 24', 'ទឹកម្ទេសវ័នម៉រ 250ក្រាម x 24', 'Chilli sauce', 13, 'omk-chili-sauce-250g', 'case', 24, 0),
  item('OMK1004', 'Chilli Sauce 500g', 'ទឹកម្ទេសវ័នម៉រ 500ក្រាម', 'Chilli sauce', 1.125, 'omk-chili-sauce-500g', 'piece', 1, 120),
  item('OMK1004-24', 'Chilli Sauce 500g × 24', 'ទឹកម្ទេសវ័នម៉រ 500ក្រាម x 24', 'Chilli sauce', 22, 'omk-chili-sauce-500g', 'case', 24, 12),

  item('OMK1007', 'Oyster Sauce 250g', 'ប្រេងខ្យងវ័នម៉រ 250ក្រាម', 'Oyster sauce', 0.625, 'omk-oyster-sauce-250g', 'piece', 1, 220),
  item('OMK1007-24', 'Oyster Sauce 250g × 24', 'ប្រេងខ្យងវ័នម៉រ 250ក្រាម x 24', 'Oyster sauce', 12.5, 'omk-oyster-sauce-250g', 'case', 24, 86),
  item('OMK1008', 'Oyster Sauce 600g', 'ប្រេងខ្យងវ័នម៉រ 600ក្រាម', 'Oyster sauce', 1.5, 'omk-oyster-sauce-600g', 'piece', 1, 140),
  item('OMK1008-24', 'Oyster Sauce 600g × 24', 'ប្រេងខ្យងវ័នម៉រ 600ក្រាម x 24', 'Oyster sauce', 30, 'omk-oyster-sauce-600g', 'case', 24, 42),

  item('OMK1001', 'Chicken Powder 165g', 'ម្សៅស៊ុបសាច់មាន់វ័នម៉រ 165ក្រាម', 'Seasoning powder', 0.875, 'omk-chicken-powder-165g', 'piece', 1, 150),
  item('OMK1001-72', 'Chicken Powder 165g × 72', 'ម្សៅស៊ុបសាច់មាន់វ័នម៉រ 165ក្រាម x 72', 'Seasoning powder', 50, 'omk-chicken-powder-165g', 'case', 72, 25),
  // The pasted row for OMK1002 is truncated. Its name follows the matching OMK1002-36 case row.
  item('OMK1002', 'Chicken Powder 400g', 'ម្សៅស៊ុបសាច់មាន់វ័នម៉រ 400ក្រាម', 'Seasoning powder', 1.5, 'omk-chicken-powder-400g', 'piece', 1, 90),
  item('OMK1002-36', 'Chicken Powder 400g × 36', 'ម្សៅស៊ុបសាច់មាន់វ័នម៉រ 400ក្រាម x 36', 'Seasoning powder', 46, 'omk-chicken-powder-400g', 'case', 36, 14),
  item('OMK1009', 'Pork Powder 165g', 'ម្សៅស៊ុបសាច់ជ្រូកវ័នម៉រ 165ក្រាម', 'Seasoning powder', 0.875, 'omk-pork-powder-165g', 'piece', 1, 110),
  item('OMK1009-72', 'Pork Powder 165g × 72', 'ម្សៅស៊ុបសាច់ជ្រូកវ័នម៉រ 165ក្រាម x 72', 'Seasoning powder', 50, 'omk-pork-powder-165g', 'case', 72, 16),
  item('OMK1010', 'Pork Powder 400g', 'ម្សៅស៊ុបសាច់ជ្រូកវ័នម៉រ 400ក្រាម', 'Seasoning powder', 1.5, 'omk-pork-powder-400g', 'piece', 1, 100),
  item('OMK1010-36', 'Pork Powder 400g × 36', 'ម្សៅស៊ុបសាច់ជ្រូកវ័នម៉រ 400ក្រាម x 36', 'Seasoning powder', 46, 'omk-pork-powder-400g', 'case', 36, 13),
  item('OMK1011', 'Vegetable Powder 165g', 'ម្សៅស៊ុបបន្លែវ័នម៉រ 165ក្រាម', 'Seasoning powder', 1, 'omk-vegetable-powder-165g', 'piece', 1, 95),
  item('OMK1011-72', 'Vegetable Powder 165g × 72', 'ម្សៅស៊ុបបន្លែវ័នម៉រ 165ក្រាម x 72', 'Seasoning powder', 50, 'omk-vegetable-powder-165g', 'case', 72, 17),
  item('OMK1012', 'Vegetable Powder 400g', 'ម្សៅស៊ុបបន្លែវ័នម៉រ 400ក្រាម', 'Seasoning powder', 1.625, 'omk-vegetable-powder-400g', 'piece', 1, 85),
  item('OMK1012-36', 'Vegetable Powder 400g × 36', 'ម្សៅស៊ុបបន្លែវ័នម៉រ 400ក្រាម x 36', 'Seasoning powder', 52, 'omk-vegetable-powder-400g', 'case', 36, 11),

  // These attached images have no SKU or price in the supplied product list.
  item(null, 'Prohok Powder 165g', null, 'Seasoning powder', null, 'omk-prohok-powder-165g'),
  item(null, 'Prohok Powder 400g', null, 'Seasoning powder', null, 'omk-prohok-powder-400g'),
  item(null, 'Fish Sauce 200ml', null, 'Fish sauce', null, 'omk-fish-sauce-200ml'),
  item(null, 'Fish Sauce 500ml', null, 'Fish sauce', null, 'omk-fish-sauce-500ml'),
  item(null, 'Soy Sauce 200ml', null, 'Soy sauce', null, 'omk-soy-sauce-200ml'),
  item(null, 'Soy Sauce 500ml', null, 'Soy sauce', null, 'omk-soy-sauce-500ml'),
  item(null, 'Hoisin Sauce 250g', null, 'Other sauces', null, 'omk-hoisin-sauce-250g'),
  item(null, 'Hoisin Sauce 500g', null, 'Other sauces', null, 'omk-hoisin-sauce-500g'),
  item(null, 'Oyster Sauce 6kg', null, 'Oyster sauce', null, 'omk-oyster-sauce-6kg'),
  item(null, 'Vegetable Oil 1L', null, 'Oil', null, 'omk-vegetable-oil-1l'),
  item(null, 'Chicken Stock 600g', null, 'Other sauces', null, 'omk-chicken-stock-600g'),
  item(null, 'Vinegar 500ml', null, 'Other sauces', null, 'omk-vinegar-500ml'),
  item(null, 'Tomato Sauce 550g', null, 'Other sauces', null, 'omk-tomato-sauce-550g'),
  item(null, 'Fermented Soybean 570g', null, 'Other sauces', null, 'omk-fermented-soybean-570g')
]

export const orderableCatalog = catalog.filter(product => product.orderable)
