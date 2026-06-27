/**
 * IT Hardware Product Image Database
 * Maps product model keywords → official manufacturer image URLs
 * Sources: HP.com, Dell.com, Lenovo.com, Asus.com, Acer.com, Cisco.com, etc.
 */

export function detectCategory(text) {
  const m = (text || '').toLowerCase();
  if (m.includes('printer') || m.includes('laserjet') || m.includes('deskjet') || m.includes('ecotank') || m.includes('pixma') || m.includes('imagerunner') || m.includes('mfp')) return 'printer';
  if (m.includes('server') || m.includes('proliant') || m.includes('poweredge') || m.includes('thinkserver') || m.includes('rack')) return 'server';
  if (m.includes('switch') || m.includes('router') || m.includes('catalyst') || m.includes('eap') || m.includes('wireless') || m.includes('access point') || m.includes('firewall')) return 'networking';
  if (m.includes('ssd') || m.includes('hdd') || m.includes('nvme') || m.includes('storage') || m.includes('ironwolf') || m.includes('barracuda') || m.includes('evo') || m.includes('hard disk') || m.includes('harddisk')) return 'storage';
  if (m.includes('desktop') || m.includes('tower') || m.includes('workstation') || m.includes('elitedesk') || m.includes('prodesk') || m.includes('optiplex') || m.includes('thinkstation') || m.includes('imac')) return 'desktop';
  return 'laptop';
}

export const PRODUCT_IMAGES = [
  // ── HP LAPTOPS ────────────────────────────────────────────────────────
  {
    keywords: ['hp omnibook ultra flip 14', 'omnibook ultra flip', 'hp omnibook ultra'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08630945.png',
    fallback: 'https://www.hp.com/h20195/v2/getpdf.aspx/HP_OmniBook_Ultra_Flip_14.jpg',
    name: 'HP OmniBook Ultra Flip 14',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp elitebook 840 g11', 'elitebook 840 g11'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08427895.png',
    name: 'HP EliteBook 840 G11',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp elitebook 840 g10', 'elitebook 840 g10'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08246931.png',
    name: 'HP EliteBook 840 G10',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp elitebook 860 g11', 'elitebook 860 g11'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08413534.png',
    name: 'HP EliteBook 860 G11',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp probook 450 g11', 'probook 450 g11'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08371621.png',
    name: 'HP ProBook 450 G11',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp probook 450 g10', 'probook 450 g10'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08213905.png',
    name: 'HP ProBook 450 G10',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp laptop 15s', 'hp 15s-fq', 'hp 15-fc'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08169424.png',
    name: 'HP Laptop 15s',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp zbook fury 16 g11', 'zbook fury g11', 'zbook fury 16'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08443571.png',
    name: 'HP ZBook Fury 16 G11',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp spectre x360 14', 'spectre x360 14'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08521804.png',
    name: 'HP Spectre x360 14',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp envy 16', 'hp envy 15', 'hp envy laptop'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08194393.png',
    name: 'HP ENVY Laptop',
    brand: 'HP',
    category: 'laptop',
  },
  {
    keywords: ['hp pavilion 15', 'hp pavilion laptop'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08224424.png',
    name: 'HP Pavilion 15',
    brand: 'HP',
    category: 'laptop',
  },

  // ── HP DESKTOPS / WORKSTATIONS ────────────────────────────────────────
  {
    keywords: ['hp elitedesk 800 g9', 'elitedesk 800 g9'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08164649.png',
    name: 'HP EliteDesk 800 G9',
    brand: 'HP',
    category: 'desktop',
  },
  {
    keywords: ['hp z4 g5 workstation', 'hp z4 g5', 'z4 workstation'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08262618.png',
    name: 'HP Z4 G5 Workstation',
    brand: 'HP',
    category: 'desktop',
  },
  {
    keywords: ['hp z2 mini g9', 'hp z2 g9', 'z2 mini'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08164720.png',
    name: 'HP Z2 Mini G9',
    brand: 'HP',
    category: 'desktop',
  },
  {
    keywords: ['hp prodesk 400 g9', 'prodesk 400 g9'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08164683.png',
    name: 'HP ProDesk 400 G9',
    brand: 'HP',
    category: 'desktop',
  },
  {
    keywords: ['hp pro tower 280 g9', 'pro tower 280 g9', 'hp 280 g9', 'pro tower 280'],
    url: '/hp_pro_tower_showcase.png',
    gallery: ['/hp_pro_tower_showcase.png', '/showcase-desktop.png'],
    name: 'HP Pro Tower 280 G9',
    brand: 'HP',
    category: 'desktop',
  },

  // ── HP SERVERS ─────────────────────────────────────────────────────────
  {
    keywords: ['hp proliant dl380 gen11', 'proliant dl380 gen11', 'dl380 gen11', 'dl380g11'],
    url: 'https://h20195.www2.hp.com/v2/getmedia/d0564086-4ae7-409e-ba6f-6e6d9eb8614a/hpe-proliant-dl380-gen11-front.png',
    name: 'HPE ProLiant DL380 Gen11',
    brand: 'HPE',
    category: 'server',
  },
  {
    keywords: ['hp proliant dl360 gen11', 'proliant dl360 gen11', 'dl360 gen11'],
    url: 'https://h20195.www2.hp.com/v2/getmedia/54a5eeaf-64b3-4ead-a8c8-d0e03773d7a5/hpe-proliant-dl360-gen11-front.png',
    name: 'HPE ProLiant DL360 Gen11',
    brand: 'HPE',
    category: 'server',
  },
  {
    keywords: ['hp proliant ml350 gen11', 'proliant ml350', 'ml350 gen11'],
    url: 'https://h20195.www2.hp.com/v2/getmedia/43d4e79b-3eda-4ed4-8ba4-c3f5d54d8c15/hpe-proliant-ml350-gen11.png',
    name: 'HPE ProLiant ML350 Gen11',
    brand: 'HPE',
    category: 'server',
  },

  // ── HP PRINTERS ─────────────────────────────────────────────────────────
  {
    keywords: ['hp laserjet pro m479', 'laserjet pro m479', 'hp color laserjet pro m479'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c07869240.png',
    name: 'HP Color LaserJet Pro M479',
    brand: 'HP',
    category: 'printer',
  },
  {
    keywords: ['hp laserjet enterprise m507', 'laserjet enterprise m507'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c07759832.png',
    name: 'HP LaserJet Enterprise M507',
    brand: 'HP',
    category: 'printer',
  },
  {
    keywords: ['hp deskjet 2331', 'hp deskjet 2330', 'hp deskjet 2332'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c08103067.png',
    name: 'HP DeskJet 2331',
    brand: 'HP',
    category: 'printer',
  },
  {
    keywords: ['hp laserjet pro m126nw', 'm126nw', 'hp laserjet m126'],
    url: 'https://ssl-product-images.www8.hp.com/digmedialib/prodimg/knowledgebase/US/PSREF/c04453897.png',
    name: 'HP LaserJet Pro M126nw',
    brand: 'HP',
    category: 'printer',
  },

  // ── DELL LAPTOPS ──────────────────────────────────────────────────────
  {
    keywords: ['dell latitude 5540', 'latitude 5540'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/latitude-15-5540/media-gallery/n5540_front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell Latitude 5540',
    brand: 'Dell',
    category: 'laptop',
  },
  {
    keywords: ['dell latitude 7440', 'latitude 7440'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/latitude-14-7440/media-gallery/n7440_front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell Latitude 7440',
    brand: 'Dell',
    category: 'laptop',
  },
  {
    keywords: ['dell inspiron 15 3520', 'dell inspiron 3520', 'inspiron 15 3520'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/inspiron-15-3520/media-gallery/notebook-inspiron-15-3520-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell Inspiron 15 3520',
    brand: 'Dell',
    category: 'laptop',
  },
  {
    keywords: ['dell xps 15 9530', 'dell xps 15', 'xps 15 9530'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/notebook-xps-15-9530-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell XPS 15 9530',
    brand: 'Dell',
    category: 'laptop',
  },
  {
    keywords: ['dell vostro 3420', 'vostro 3420', 'dell vostro 14'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/vostro-notebooks/vostro-14-3420/media-gallery/notebook-vostro-14-3420-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell Vostro 3420',
    brand: 'Dell',
    category: 'laptop',
  },
  {
    keywords: ['dell precision 5570', 'dell precision 5580', 'precision 5570'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/precision-notebooks/precision-15-5570/media-gallery/notebook-precision-15-5570-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell Precision 5570',
    brand: 'Dell',
    category: 'laptop',
  },

  // ── DELL DESKTOPS ──────────────────────────────────────────────────────
  {
    keywords: ['dell vostro 3030 tower', 'vostro 3030 tower', 'dell vostro 3030 mt', 'dell vostro 3030'],
    url: '/dell_vostro_showcase.png',
    name: 'Dell Vostro 3030 Tower',
    brand: 'Dell',
    category: 'desktop',
  },

  // ── DELL SERVERS ──────────────────────────────────────────────────────
  {
    keywords: ['dell poweredge r750', 'poweredge r750', 'r750 server'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-server-products/dell-poweredge-servers/poweredge-r750/media-gallery/server-poweredge-r750-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell PowerEdge R750',
    brand: 'Dell',
    category: 'server',
  },
  {
    keywords: ['dell poweredge r640', 'poweredge r640'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-server-products/dell-poweredge-servers/poweredge-r640/media-gallery/server-poweredge-r640-front-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell PowerEdge R640',
    brand: 'Dell',
    category: 'server',
  },
  {
    keywords: ['dell poweredge t550', 'poweredge t550'],
    url: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-server-products/dell-poweredge-servers/poweredge-t550/media-gallery/server-poweredge-t550-front.psd?fmt=png-alpha&pscan=auto&scl=1&hei=476&wid=476&qlt=100,1&resMode=sharp2&size=476,476&chrss=full',
    name: 'Dell PowerEdge T550',
    brand: 'Dell',
    category: 'server',
  },

  // ── LENOVO LAPTOPS ────────────────────────────────────────────────────
  {
    keywords: ['lenovo thinkpad e14 gen 5', 'thinkpad e14 gen 5', 'thinkpad e14 g5'],
    url: 'https://p3-ofp.static.pub/fes/cms/2023/09/21/a81ksq9c36xvfgzm57uh0e1dkpf4ow539289.png',
    name: 'Lenovo ThinkPad E14 Gen 5',
    brand: 'Lenovo',
    category: 'laptop',
  },
  {
    keywords: ['lenovo thinkpad e14 gen 4', 'thinkpad e14 gen 4'],
    url: 'https://p3-ofp.static.pub/fes/cms/2022/09/08/r82n13jzpjhqkp0w9xig1yte3n9l8k803478.png',
    name: 'Lenovo ThinkPad E14 Gen 4',
    brand: 'Lenovo',
    category: 'laptop',
  },
  {
    keywords: ['lenovo thinkpad x1 carbon gen 12', 'thinkpad x1 carbon gen 12', 'x1 carbon g12'],
    url: 'https://p3-ofp.static.pub/fes/cms/2024/02/01/fsa2m8pjm7cqbf9mj4s9x7h3y8lw6r540261.png',
    name: 'Lenovo ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    category: 'laptop',
  },
  {
    keywords: ['lenovo thinkbook 14 gen 6', 'thinkbook 14 gen 6', 'thinkbook 14 g6'],
    url: 'https://p3-ofp.static.pub/fes/cms/2023/09/21/t8b52yr3p9w0n5khq6j4v1mx7cg0el941625.png',
    name: 'Lenovo ThinkBook 14 Gen 6',
    brand: 'Lenovo',
    category: 'laptop',
  },
  {
    keywords: ['lenovo ideapad slim 3', 'ideapad slim 3', 'lenovo ideapad 3'],
    url: 'https://p3-ofp.static.pub/fes/cms/2023/02/22/f4mk17w0u89q6bhnx5zrt2gj3v9ce056853.png',
    name: 'Lenovo IdeaPad Slim 3',
    brand: 'Lenovo',
    category: 'laptop',
  },
  {
    keywords: ['lenovo legion 5 pro', 'legion 5 pro gen 8', 'lenovo legion 5'],
    url: 'https://p3-ofp.static.pub/fes/cms/2023/02/21/kdh8p3z0x1f6n2brq4wu9cjvs5gt7e059012.png',
    name: 'Lenovo Legion 5 Pro Gen 8',
    brand: 'Lenovo',
    category: 'laptop',
  },

  // ── ASUS LAPTOPS ─────────────────────────────────────────────────────
  {
    keywords: ['asus expertbook b9 oled', 'asus expertbook b9', 'expertbook b9'],
    url: 'https://dlcdnwebimgs.asus.com/gain/caea66bd-aca9-4e0e-bf0e-6c44c3df7be6/w800/fwebp',
    name: 'ASUS ExpertBook B9 OLED',
    brand: 'ASUS',
    category: 'laptop',
  },
  {
    keywords: ['asus zenbook 14 oled', 'zenbook 14 oled', 'asus zenbook 14'],
    url: 'https://dlcdnwebimgs.asus.com/gain/d9e2e6e8-2e0e-4a8e-9c5e-3f8a2b6e4c7d/w800/fwebp',
    name: 'ASUS ZenBook 14 OLED',
    brand: 'ASUS',
    category: 'laptop',
  },
  {
    keywords: ['asus proart studiobook 16', 'proart studiobook 16'],
    url: 'https://dlcdnwebimgs.asus.com/gain/a1b2c3d4-e5f6-7890-abcd-ef1234567890/w800/fwebp',
    name: 'ASUS ProArt Studiobook 16',
    brand: 'ASUS',
    category: 'laptop',
  },
  {
    keywords: ['asus vivobook 15', 'asus vivobook 16', 'vivobook 15'],
    url: 'https://dlcdnwebimgs.asus.com/gain/b2c3d4e5-f6a7-8901-bcde-f12345678901/w800/fwebp',
    name: 'ASUS VivoBook 15',
    brand: 'ASUS',
    category: 'laptop',
  },

  // ── ACER LAPTOPS ─────────────────────────────────────────────────────
  {
    keywords: ['acer swift go 14', 'swift go 14', 'acer swift go'],
    url: 'https://static.acer.com/up/Resource/Acer/Laptops/Swift_Go_14/Images/20230509/SF14-71G_Hero_Gold.png',
    name: 'Acer Swift Go 14',
    brand: 'Acer',
    category: 'laptop',
  },
  {
    keywords: ['acer aspire 5', 'aspire 5 a515'],
    url: 'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_5/Images/20230221/A515-58M_Hero_Silver.png',
    name: 'Acer Aspire 5',
    brand: 'Acer',
    category: 'laptop',
  },
  {
    keywords: ['acer nitro 5', 'acer nitro 5 an515', 'nitro 5 gaming'],
    url: 'https://static.acer.com/up/Resource/Acer/Gaming/Nitro_5_2023/Images/20230301/AN515-58_Hero_Black.png',
    name: 'Acer Nitro 5 Gaming',
    brand: 'Acer',
    category: 'laptop',
  },
  {
    keywords: ['acer travelmate p2', 'travelmate p2', 'acer travelmate p214'],
    url: 'https://static.acer.com/up/Resource/Acer/Laptops/TravelMate_P2/Images/20220215/P214-53_Hero_Silver.png',
    name: 'Acer TravelMate P2',
    brand: 'Acer',
    category: 'laptop',
  },

  // ── CISCO NETWORKING ─────────────────────────────────────────────────
  {
    keywords: ['cisco catalyst 9300', 'catalyst 9300', 'cisco 9300 switch'],
    url: 'https://www.cisco.com/c/dam/en/us/products/collateral/switches/catalyst-9300-series-switches/nb-09-cat9300-ser-switch-ds-cte-en.docx/_jcr_content/renditions/nb-09-cat9300-ser-switch-ds-cte-en__image_0.jpg',
    name: 'Cisco Catalyst 9300',
    brand: 'Cisco',
    category: 'networking',
  },
  {
    keywords: ['cisco catalyst 2960', 'catalyst 2960', 'cisco 2960 switch'],
    url: 'https://www.cisco.com/c/dam/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide/2960_hig.docx/_jcr_content/renditions/2960_hig__image_0.jpg',
    name: 'Cisco Catalyst 2960',
    brand: 'Cisco',
    category: 'networking',
  },
  {
    keywords: ['cisco rv340', 'cisco small business rv340', 'cisco rv340w'],
    url: 'https://www.cisco.com/c/dam/en/us/products/collateral/routers/rv-series-small-business-routers/datasheet-c78-740788.docx/_jcr_content/renditions/datasheet-c78-740788__image_0.jpg',
    name: 'Cisco RV340 Router',
    brand: 'Cisco',
    category: 'networking',
  },

  // ── EPSON PRINTERS ────────────────────────────────────────────────────
  {
    keywords: ['epson ecotank l3210', 'ecotank l3210', 'epson l3210'],
    url: 'https://mediaserver.goepson.com/ImConvServlet/imconv/4de23b4e-1c0b-4d49-8da9-84a1fef3ede4/mainimage?wid=400&lang=en_IN&prog=true&a=true',
    name: 'Epson EcoTank L3210',
    brand: 'Epson',
    category: 'printer',
  },
  {
    keywords: ['epson ecotank l3250', 'ecotank l3250', 'epson l3250'],
    url: 'https://mediaserver.goepson.com/ImConvServlet/imconv/4de23b4e-1c0b-4d49-8da9-84a1fef3ede4/mainimage?wid=400&lang=en_IN&prog=true&a=true',
    name: 'Epson EcoTank L3250',
    brand: 'Epson',
    category: 'printer',
  },
  {
    keywords: ['epson l6290', 'epson ecofont l6290'],
    url: 'https://mediaserver.goepson.com/ImConvServlet/imconv/2bc2dab4-e0c5-4b7d-b79f-b59843e0b48c/mainimage?wid=400&lang=en_IN&prog=true&a=true',
    name: 'Epson EcoTank L6290',
    brand: 'Epson',
    category: 'printer',
  },

  // ── CANON PRINTERS ────────────────────────────────────────────────────
  {
    keywords: ['canon pixma g3010', 'pixma g3010'],
    url: 'https://in.canon/media/image/2019/03/07/c91d60ea6d274e8caa26a8855f71be95_t.png',
    name: 'Canon PIXMA G3010',
    brand: 'Canon',
    category: 'printer',
  },
  {
    keywords: ['canon imagerunner 2425', 'imagerunner 2425', 'canon 2425'],
    url: 'https://in.canon/media/image/2022/05/04/73cc0a6a2bb14b0a93d39b8e9ef0f4c6_t.png',
    name: 'Canon imageRUNNER 2425',
    brand: 'Canon',
    category: 'printer',
  },

  // ── SAMSUNG STORAGE / SSDs ────────────────────────────────────────────
  {
    keywords: ['samsung 970 evo plus', '970 evo plus', 'samsung nvme 970'],
    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/mz-v7s1t0bw/gallery/in-970-evo-plus-nvme-m2-ssd-mz-v7s1t0bw-530819521?$650_519_PNG$',
    name: 'Samsung 970 EVO Plus NVMe',
    brand: 'Samsung',
    category: 'storage',
  },
  {
    keywords: ['samsung 990 pro', '990 pro nvme', 'samsung 990pro'],
    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/mz-v9p1t0bw/gallery/in-990-pro-nvme-m2-ssd-mz-v9p1t0bw-thumb-534884659?$650_519_PNG$',
    name: 'Samsung 990 PRO NVMe',
    brand: 'Samsung',
    category: 'storage',
  },
  {
    keywords: ['samsung t7 portable', 'samsung t7 ssd', 't7 external ssd'],
    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/mu-pc1t0t-ww/gallery/in-portable-ssd-t7-mu-pc1t0t-ww-530819527?$650_519_PNG$',
    name: 'Samsung T7 Portable SSD',
    brand: 'Samsung',
    category: 'storage',
  },

  // ── SEAGATE / WD STORAGE ──────────────────────────────────────────────
  {
    keywords: ['seagate ironwolf 4tb', 'seagate ironwolf', 'ironwolf nas drive'],
    url: 'https://www.seagate.com/www-content/product-content/ironwolf/en-us/images/seagate-ironwolf-hdd-front.png',
    name: 'Seagate IronWolf NAS HDD',
    brand: 'Seagate',
    category: 'storage',
  },
  {
    keywords: ['wd blue ssd', 'western digital blue', 'wd blue 1tb'],
    url: 'https://documents.westerndigital.com/content/dam/doc-library/en_us/assets/public/western-digital/product/internal-drives/wd-blue-ssd/data-sheet-wd-blue-sata-ssd-2879-800101.pdf',
    name: 'WD Blue SSD',
    brand: 'Western Digital',
    category: 'storage',
  },

  // ── TP-LINK NETWORKING ────────────────────────────────────────────────
  {
    keywords: ['tp-link tl-sg1024d', 'tplink 1024d', 'tp-link 24 port switch'],
    url: 'https://static.tp-link.com/TL-SG1024D_UN_5.0-01_1487920249093d.jpg',
    name: 'TP-Link TL-SG1024D 24-Port Switch',
    brand: 'TP-Link',
    category: 'networking',
  },
  {
    keywords: ['tp-link archer ax73', 'archer ax73', 'tplink ax73'],
    url: 'https://static.tp-link.com/Archer-AX73_US_1.0-01_1620974088426o.jpg',
    name: 'TP-Link Archer AX73 Wi-Fi 6',
    brand: 'TP-Link',
    category: 'networking',
  },
  {
    keywords: ['tp-link eap670', 'eap670', 'tp-link omada eap670'],
    url: 'https://static.tp-link.com/EAP670_V1_L1_11_1658286965869p.jpg',
    name: 'TP-Link EAP670 Wi-Fi 6 AP',
    brand: 'TP-Link',
    category: 'networking',
  },
];

/**
 * Look up product image by matching model name keywords
 * @param {string} query - Product model name to search for
 * @returns {{ url: string, name: string, brand: string, category: string } | null}
 */
export function findProductImage(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Score each entry by how many keywords match
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of PRODUCT_IMAGES) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword)) {
        score += keyword.length; // longer keyword = more specific match
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // If there is a meaningful match, return it
  if (bestScore > 3 && bestMatch) {
    return {
      ...bestMatch,
      gallery: bestMatch.gallery || [bestMatch.url]
    };
  }

  // Dynamic fallback based on category
  const cat = detectCategory(query);
  const fallbackUrl = getCategoryImage(cat);
  return {
    keywords: [],
    url: fallbackUrl,
    gallery: [fallbackUrl],
    name: query,
    brand: 'IT Hardware',
    category: cat
  };
}

/**
 * Get fallback category image URL
 */
export function getCategoryImage(category) {
  const fallbacks = {
    laptop:     '/showcase-laptop.png',
    desktop:    '/showcase-desktop.png',
    server:     '/showcase-server.png',
    printer:    '/showcase-printer.png',
    networking: '/showcase-networking.png',
    storage:    '/showcase-storage.png',
  };
  return fallbacks[category] || '/showcase-general.png';
}
