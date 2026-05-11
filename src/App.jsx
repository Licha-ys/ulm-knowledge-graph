import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
const NODE_POSITION_STORAGE_KEY = 'ulm-knowledge-node-positions-v2'

const fallbackImages = {
  institution: `${COMMONS_FILE}Hochschule_fuer_Gestaltung_Ulm.jpg?width=900`,
  person: `${COMMONS_FILE}Max_Bill_1970.jpg?width=900`,
  work: `${COMMONS_FILE}Braun-SK-4-Phonosuper-1956.png?width=900`,
  theory: `${COMMONS_FILE}Isotype_Arntz_1930s.png?width=900`,
  concept: `${COMMONS_FILE}Information_icon.svg?width=900`,
  project: `${COMMONS_FILE}Project_Cybersyn_control_room.jpg?width=900`,
}

const stableFallbackById = {
  ulmModel: `${COMMONS_FILE}Hochschule_fuer_Gestaltung_Ulm.jpg?width=900`,
  ulmStool: `${COMMONS_FILE}Ulmer_Hocker.jpg?width=900`,
  shelving606: `${COMMONS_FILE}Dieter_Rams_606_Universal_Shelving_System.jpg?width=900`,
  lufthansa: `${COMMONS_FILE}Lufthansa_Boeing_747-830_D-ABYA.jpg?width=900`,
  munich72: `${COMMONS_FILE}Olympiapark_Munich_1972.jpg?width=900`,
  semiology: `${COMMONS_FILE}Jacques_Bertin.jpg?width=900`,
  visualDisplay: `${COMMONS_FILE}Edward_Tufte_-_March_2015.jpg?width=900`,
  infoAnxiety: `${COMMONS_FILE}Richard_Saul_Wurman.jpg?width=900`,
  interfaceTheory: `${COMMONS_FILE}Graphical_user_interface.svg?width=900`,
  vitsoe: `${COMMONS_FILE}Dieter_Rams_606_Universal_Shelving_System.jpg?width=900`,
  stuttgart: `${COMMONS_FILE}Universitaet_Stuttgart_Logo.svg?width=900`,
  toronto: `${COMMONS_FILE}University_of_Toronto_-_Convocation_Hall.jpg?width=900`,
  mit: `${COMMONS_FILE}MIT_Building_10_and_the_Great_Dome,_Cambridge_MA.jpg?width=900`,
  hfg: `${COMMONS_FILE}Hochschule_fuer_Gestaltung_Ulm.jpg?width=900`,
  braun: `${COMMONS_FILE}Braun_Logo.svg?width=900`,
  isotype: `${COMMONS_FILE}Isotype_Arntz_1930s.png?width=900`,
  ted: `${COMMONS_FILE}TED_Conference_logo.svg?width=900`,
  cybersyn: `${COMMONS_FILE}Project_Cybersyn_control_room.jpg?width=900`,
}

const fixedImageById = {
  braun: {
    image: `${COMMONS_FILE}Braun_Logo.svg?width=900`,
    imageSource: 'https://commons.wikimedia.org/wiki/File:Braun_Logo.svg',
    imageAttribution: 'Braun',
    imageLicense: 'Public domain text logo / Wikimedia Commons',
  },
}

const zoneMeta = {
  academy: { name: '学院体系', idea: '方法的形成', color: '#5d8ed8', main: 'HfG Ulm / Bauhaus' },
  practice: { name: '企业实践', idea: '方法的落地', color: '#df884b', main: 'Braun / Vitsœ / Lufthansa' },
  theory: { name: '理论研究', idea: '方法的支撑', color: '#7f83bc', main: 'MIT / Yale / Stuttgart / Toronto' },
}

const nodeTypeNames = {
  institution: '机构',
  person: '人物',
  work: '作品',
  theory: '理论',
  concept: '概念',
  project: '项目',
}

const zones = [
  {
    id: 'academy',
    title: '学院体系',
    subtitle: '方法的形成',
    color: '#76a7f2',
    path: 'M-1180,-720 C-980,-900 -620,-910 -415,-790 C-210,-670 -140,-410 -245,-220 C-360,-10 -690,55 -945,-50 C-1200,-155 -1370,-470 -1180,-720 Z',
    label: { x: -1120, y: -750 },
  },
  {
    id: 'practice',
    title: '企业实践',
    subtitle: '方法的落地',
    color: '#ed9b5f',
    path: 'M345,-770 C570,-925 1000,-895 1215,-655 C1425,-420 1295,-120 1010,-35 C720,52 395,-45 245,-265 C105,-470 145,-635 345,-770 Z',
    label: { x: 355, y: -758 },
  },
  {
    id: 'theory',
    title: '理论研究',
    subtitle: '方法的支撑',
    color: '#9696ca',
    path: 'M-945,165 C-650,15 -90,60 220,172 C560,295 1095,198 1240,515 C1390,842 1015,1115 520,1110 C60,1105 -455,1035 -775,850 C-1085,670 -1245,320 -945,165 Z',
    label: { x: -930, y: 150 },
  },
]

const baseNodes = [
  { id: 'bauhaus', type: 'institution', zone: 'academy', zh: '包豪斯', en: 'Bauhaus', role: '现代设计教育源流', x: -1050, y: -560, wikiTitle: 'Bauhaus', commonsSearch: 'Bauhaus Dessau building', summary: '现代主义设计教育的重要源头，影响乌尔姆的基础课程、综合设计观与理性形式传统。', tags: ['现代主义', '教育', '形式'] },
  { id: 'hfg', type: 'institution', zone: 'academy', zh: '乌尔姆设计学院', en: 'HfG Ulm', role: '方法形成中心', x: -760, y: -445, wikiTitle: 'Ulm School of Design', commonsSearch: 'Hochschule fuer Gestaltung Ulm', summary: '将科学、技术、社会与设计教育结合，形成系统化、理性化的设计方法。', tags: ['乌尔姆模式', '系统方法', '设计教育'] },
  { id: 'maxBill', type: 'person', zone: 'academy', zh: '马克斯·比尔', en: 'Max Bill', role: '创校校长 / 设计师', x: -965, y: -300, wikiTitle: 'Max Bill', commonsSearch: 'Max Bill designer', summary: '推动乌尔姆早期教育框架，并延续包豪斯的理性形式传统。', tags: ['具体艺术', '教育体系', '形式理性'] },
  { id: 'aicher', type: 'person', zone: 'academy', zh: '奥托·艾歇尔', en: 'Otl Aicher', role: '视觉传达 / 公共系统', x: -635, y: -250, wikiTitle: 'Otl Aicher', commonsSearch: 'Otl Aicher pictograms', summary: '乌尔姆核心人物，将网格、符号和公共视觉系统推向成熟实践。', tags: ['视觉识别', '网格', 'pictogram'] },
  { id: 'maldonado', type: 'person', zone: 'academy', zh: '托马斯·马尔多纳多', en: 'Tomás Maldonado', role: '系统方法倡导者', x: -465, y: -480, wikiTitle: 'Tomás Maldonado', commonsSearch: 'Tomas Maldonado designer', summary: '强调科学、控制论和系统思维进入设计教育。', tags: ['系统', '科学化', '方法论'] },
  { id: 'gugelot', type: 'person', zone: 'academy', zh: '汉斯·古格洛特', en: 'Hans Gugelot', role: '产品设计 / 接口', x: -850, y: -680, wikiTitle: 'Hans Gugelot', commonsSearch: 'Hans Gugelot Braun design', summary: '把乌尔姆的产品系统思想带入企业合作，尤其影响 Braun。', tags: ['产品系统', 'Braun', '接口'] },
  { id: 'bonsiepe', type: 'person', zone: 'academy', zh: '桂·邦西普', en: 'Gui Bonsiepe', role: '方法转译 / 界面理论', x: -350, y: -165, wikiTitle: 'Gui Bonsiepe', commonsSearch: 'Gui Bonsiepe design', summary: '将乌尔姆方法延展到发展、信息、界面与设计理论领域。', tags: ['界面', '方法转译', '设计理论'] },
  { id: 'ulmModel', type: 'concept', zone: 'academy', zh: '乌尔姆模式', en: 'Ulm Model', role: '教育模式', x: -575, y: -650, wikiTitle: 'Ulm School of Design', commonsSearch: 'Ulm School of Design', summary: '以跨学科、系统分析、社会功能为核心的设计教育模式。', tags: ['跨学科', '系统分析', '功能'] },
  { id: 'ulmStool', type: 'work', zone: 'academy', zh: '乌尔姆凳', en: 'Ulmer Hocker', role: '代表作品', x: -1100, y: -110, wikiTitle: 'Ulmer Hocker', commonsSearch: 'Ulmer Hocker', summary: '乌尔姆简洁、模块化与多用途设计态度的经典物件。', tags: ['模块', '家具', '极简'] },

  { id: 'braun', type: 'institution', zone: 'practice', zh: '博朗', en: 'Braun', role: '企业实践核心', x: 690, y: -455, wikiTitle: 'Braun (company)', commonsSearch: 'Braun company design', summary: '德国电器企业，成为乌尔姆方法在工业产品中的关键验证场。', tags: ['工业设计', '产品系统', '德国'] },
  { id: 'vitsoe', type: 'institution', zone: 'practice', zh: '维特索', en: 'Vitsœ', role: '系统家具实践', x: 1045, y: -265, wikiTitle: 'Vitsœ', commonsSearch: 'Vitsoe 606 Universal Shelving System', summary: '长期生产 Rams 的 606 系统，体现可持续的系统产品逻辑。', tags: ['606', '家具系统', '长期主义'] },
  { id: 'braunBrothers', type: 'person', zone: 'practice', zh: '博朗兄弟', en: 'Braun Brothers', role: '企业创始背景', x: 1010, y: -610, wikiTitle: 'Braun (company)', commonsSearch: 'Braun company founders', summary: 'Braun 企业文化与产品现代化转型的历史背景。', tags: ['企业', '创始', '制造'] },
  { id: 'rams', type: 'person', zone: 'practice', zh: '迪特·拉姆斯', en: 'Dieter Rams', role: '设计领导', x: 455, y: -585, wikiTitle: 'Dieter Rams', commonsSearch: 'Dieter Rams', summary: '以少即是多、系统产品和清晰界面塑造 Braun 与 Vitsœ 的设计语言。', tags: ['少即是多', '系统产品', '好设计'] },
  { id: 'eichler', type: 'person', zone: 'practice', zh: '弗里茨·艾希勒', en: 'Fritz Eichler', role: '产品开发 / 设计管理', x: 455, y: -325, wikiTitle: 'Fritz Eichler', commonsSearch: 'Fritz Eichler Braun', summary: '参与 Braun 设计文化建设，将产品、传播和企业形象整合。', tags: ['设计管理', '产品文化', 'Braun'] },
  { id: 'sk4', type: 'work', zone: 'practice', zh: 'Braun SK4', en: 'Braun SK 4', role: '音响产品', x: 750, y: -710, wikiTitle: 'Braun SK 4', commonsSearch: 'Braun SK 4', summary: '透明上盖与清晰结构使其成为现代产品设计的标志。', tags: ['音响', '透明', '产品语言'] },
  { id: 'shelving606', type: 'work', zone: 'practice', zh: '606 通用搁架系统', en: '606 Universal Shelving System', role: '系统家具', x: 1125, y: -20, wikiTitle: '606 Universal Shelving System', commonsSearch: '606 Universal Shelving System Dieter Rams', summary: '可扩展、可维修、可长期使用的系统化家具设计。', tags: ['模块', '可扩展', '家具'] },
  { id: 'lufthansa', type: 'work', zone: 'practice', zh: '汉莎航空视觉识别', en: 'Lufthansa Visual Identity', role: '企业识别', x: 805, y: -110, wikiTitle: 'Lufthansa', commonsSearch: 'Lufthansa logo visual identity', summary: '以严密视觉系统和标准化传播塑造航空品牌识别。', tags: ['VI', '公共传播', '标准化'] },
  { id: 'munich72', type: 'project', zone: 'practice', zh: '慕尼黑 1972 奥运视觉系统', en: 'Munich 1972 Visual System', role: '公共视觉系统', x: 360, y: -40, wikiTitle: '1972 Summer Olympics', commonsSearch: 'Munich 1972 pictograms Otl Aicher', summary: '网格、色彩和 pictogram 协同构成大型公共信息系统。', tags: ['奥运', '导视', 'pictogram'] },

  { id: 'isotype', type: 'theory', zone: 'theory', zh: 'ISOTYPE', en: 'International System of Typographic Picture Education', role: '图像语言', x: -900, y: 360, wikiTitle: 'Isotype (picture language)', commonsSearch: 'Isotype picture language', summary: '以图像统计和标准化符号支持公众理解复杂社会信息。', tags: ['图像统计', '符号', '教育'] },
  { id: 'yale', type: 'institution', zone: 'theory', zh: 'Yale / Graphics Press', en: 'Graphics Press', role: '出版 / 学术传播', x: -555, y: 290, wikiTitle: 'Graphics Press', commonsSearch: 'Edward Tufte Graphics Press', summary: '与 Tufte 的信息设计出版和课程传播紧密相关。', tags: ['出版', '数据可视化', '学术'] },
  { id: 'ted', type: 'institution', zone: 'theory', zh: 'TED', en: 'TED', role: '传播平台', x: -185, y: 275, wikiTitle: 'TED (conference)', commonsSearch: 'TED conference', summary: '将技术、娱乐、设计作为公共知识传播的舞台。', tags: ['传播', '会议', '公共知识'] },
  { id: 'mit', type: 'institution', zone: 'theory', zh: 'MIT', en: 'Massachusetts Institute of Technology', role: '技术 / 媒介研究', x: 170, y: 285, wikiTitle: 'Massachusetts Institute of Technology', commonsSearch: 'Massachusetts Institute of Technology', summary: '连接技术、媒体、控制论与设计研究的重要学术节点。', tags: ['技术', '媒体', '研究'] },
  { id: 'stuttgart', type: 'institution', zone: 'theory', zh: '斯图加特大学', en: 'University of Stuttgart', role: '信息美学语境', x: 560, y: 315, wikiTitle: 'University of Stuttgart', commonsSearch: 'University of Stuttgart', summary: '与德国战后信息美学、符号学和理性设计讨论相连。', tags: ['信息美学', '德国', '理论'] },
  { id: 'toronto', type: 'institution', zone: 'theory', zh: '多伦多大学', en: 'University of Toronto', role: '媒介理论语境', x: 930, y: 390, wikiTitle: 'University of Toronto', commonsSearch: 'University of Toronto', summary: 'McLuhan 媒介理论的重要学术场域。', tags: ['媒介理论', '传播', '加拿大'] },
  { id: 'neurath', type: 'person', zone: 'theory', zh: '奥托·纽拉特', en: 'Otto Neurath', role: 'ISOTYPE 提出者', x: -1030, y: 625, wikiTitle: 'Otto Neurath', commonsSearch: 'Otto Neurath', summary: '推动图像统计和社会知识的视觉化普及。', tags: ['ISOTYPE', '统计', '社会知识'] },
  { id: 'bertin', type: 'person', zone: 'theory', zh: '雅克·贝尔丹', en: 'Jacques Bertin', role: '图形符号学', x: -705, y: 560, wikiTitle: 'Jacques Bertin', commonsSearch: 'Jacques Bertin cartography', summary: '建立视觉变量与图形符号学框架。', tags: ['视觉变量', '地图', '符号学'] },
  { id: 'tufte', type: 'person', zone: 'theory', zh: '爱德华·塔夫特', en: 'Edward Tufte', role: '数据可视化', x: -405, y: 520, wikiTitle: 'Edward Tufte', commonsSearch: 'Edward Tufte', summary: '强调数据墨水、证据展示与信息密度。', tags: ['数据墨水', '证据', '可视化'] },
  { id: 'wurman', type: 'person', zone: 'theory', zh: '理查德·索尔·沃曼', en: 'Richard Saul Wurman', role: '信息架构', x: -95, y: 520, wikiTitle: 'Richard Saul Wurman', commonsSearch: 'Richard Saul Wurman', summary: '提出信息焦虑，并推动信息架构成为设计议题。', tags: ['信息架构', '信息焦虑', 'TED'] },
  { id: 'wiener', type: 'person', zone: 'theory', zh: '诺伯特·维纳', en: 'Norbert Wiener', role: '控制论奠基', x: 225, y: 535, wikiTitle: 'Norbert Wiener', commonsSearch: 'Norbert Wiener', summary: '控制论为系统、反馈、通信与设计方法提供理论支撑。', tags: ['控制论', '反馈', '系统'] },
  { id: 'bense', type: 'person', zone: 'theory', zh: '马克斯·本泽', en: 'Max Bense', role: '信息美学', x: 535, y: 590, wikiTitle: 'Max Bense', commonsSearch: 'Max Bense', summary: '发展信息美学，连接美学、符号与信息理论。', tags: ['美学', '信息', '符号'] },
  { id: 'mcluhan', type: 'person', zone: 'theory', zh: '马歇尔·麦克卢汉', en: 'Marshall McLuhan', role: '媒介理论', x: 865, y: 620, wikiTitle: 'Marshall McLuhan', commonsSearch: 'Marshall McLuhan', summary: '以媒介即信息、全球村等概念重新理解传播环境。', tags: ['媒介', '全球村', '传播'] },
  { id: 'semiology', type: 'theory', zone: 'theory', zh: '图形符号学', en: 'Semiology of Graphics', role: '理论著作', x: -765, y: 815, wikiTitle: 'Semiology of Graphics', commonsSearch: 'Semiology of Graphics Jacques Bertin', summary: '将图形系统、视觉变量和信息编码建立为分析框架。', tags: ['视觉变量', '编码', '图形'] },
  { id: 'visualDisplay', type: 'theory', zone: 'theory', zh: '定量信息的视觉呈现', en: 'The Visual Display of Quantitative Information', role: '理论著作', x: -430, y: 835, wikiTitle: 'The Visual Display of Quantitative Information', commonsSearch: 'The Visual Display of Quantitative Information', summary: '现代数据可视化理论的重要文本。', tags: ['数据', '图表', '证据'] },
  { id: 'infoAnxiety', type: 'concept', zone: 'theory', zh: '信息焦虑', en: 'Information Anxiety', role: '概念', x: -100, y: 835, wikiTitle: 'Information Anxiety', commonsSearch: 'Information Anxiety Richard Saul Wurman', summary: '描述信息过载与理解困难之间的张力。', tags: ['过载', '理解', '架构'] },
  { id: 'cybernetics', type: 'theory', zone: 'theory', zh: '控制论', en: 'Cybernetics', role: '系统理论', x: 245, y: 825, wikiTitle: 'Cybernetics', commonsSearch: 'Cybernetics diagram', summary: '研究控制、反馈和通信机制，是系统设计方法的重要基础。', tags: ['反馈', '控制', '通信'] },
  { id: 'infoTheory', type: 'theory', zone: 'theory', zh: '信息论', en: 'Information Theory', role: '理论基础', x: 520, y: 835, wikiTitle: 'Information theory', commonsSearch: 'Information theory diagram', summary: '以信号、噪声、编码和传输解释信息。', tags: ['编码', '噪声', '信号'] },
  { id: 'infoAesthetics', type: 'theory', zone: 'theory', zh: '信息美学', en: 'Information Aesthetics', role: '理论发展', x: 690, y: 760, wikiTitle: 'Information aesthetics', commonsSearch: 'information aesthetics data visualization', summary: '用信息和符号维度解释审美与形式秩序。', tags: ['美学', '形式', '信息'] },
  { id: 'systems', type: 'concept', zone: 'theory', zh: '系统方法', en: 'Systems Theory', role: '方法概念', x: 60, y: 1010, wikiTitle: 'Systems theory', commonsSearch: 'Systems theory diagram', summary: '把对象看成互相关联的结构、流程与反馈关系。', tags: ['结构', '流程', '方法'] },
  { id: 'cybersyn', type: 'project', zone: 'theory', zh: 'Project Cybersyn', en: 'Project Cybersyn', role: '控制论实践', x: 380, y: 1030, wikiTitle: 'Project Cybersyn', commonsSearch: 'Project Cybersyn control room', summary: '将控制论、数据和治理系统结合的历史性实验。', tags: ['控制室', '治理', '数据'] },
  { id: 'understandingMedia', type: 'theory', zone: 'theory', zh: '理解媒介', en: 'Understanding Media', role: '著作', x: 910, y: 850, wikiTitle: 'Understanding Media', commonsSearch: 'Understanding Media Marshall McLuhan book', summary: 'McLuhan 讨论媒介如何塑造感知、社会和文化。', tags: ['媒介', '感知', '文化'] },
  { id: 'mediumMessage', type: 'concept', zone: 'theory', zh: '媒介即信息', en: 'The Medium is the Message', role: '核心命题', x: 1130, y: 700, wikiTitle: 'The medium is the message', commonsSearch: 'The medium is the message McLuhan', summary: '强调媒介形式本身塑造信息经验。', tags: ['媒介', '形式', '经验'] },
  { id: 'globalVillage', type: 'concept', zone: 'theory', zh: '全球村', en: 'Global Village', role: '传播观念', x: 1115, y: 940, wikiTitle: 'Global village', commonsSearch: 'Global village communication', summary: '电子媒介压缩距离，改变社会尺度与关系。', tags: ['电子媒介', '传播', '尺度'] },
  { id: 'mediaEcology', type: 'concept', zone: 'theory', zh: '信息环境', en: 'Media Ecology', role: '媒介环境', x: 745, y: 1010, wikiTitle: 'Media ecology', commonsSearch: 'Media ecology', summary: '将媒介视为塑造认知与社会行为的信息环境。', tags: ['环境', '媒介', '认知'] },
  { id: 'interfaceTheory', type: 'concept', zone: 'theory', zh: '界面理论', en: 'Interface Theory', role: '设计转译', x: -235, y: 1020, wikiTitle: 'User interface', commonsSearch: 'User interface history', summary: '把信息、行动与使用者之间的关系转译为可操作界面。', tags: ['界面', '转译', '交互'] },
]

const edgeRows = [
  ['bauhaus', 'hfg', '思想影响', 'influence'], ['maxBill', 'hfg', '早期教育体系', 'personInstitution'], ['aicher', 'hfg', '任教 / 视觉传达', 'personInstitution'], ['maldonado', 'hfg', '系统方法', 'personInstitution'], ['gugelot', 'hfg', '产品接口', 'personInstitution'], ['bonsiepe', 'hfg', '方法延伸', 'personInstitution'], ['hfg', 'ulmModel', '教育模型', 'thought'], ['maxBill', 'ulmStool', '设计实践', 'personWork'],
  ['braun', 'rams', '设计领导', 'personInstitution'], ['braun', 'eichler', '产品开发', 'personInstitution'], ['rams', 'sk4', '设计实践', 'personWork'], ['rams', 'shelving606', '系统产品', 'personWork'], ['vitsoe', 'shelving606', '长期设计', 'practiceProject'], ['aicher', 'lufthansa', '视觉识别', 'practiceProject'], ['aicher', 'munich72', '公共视觉系统', 'practiceProject'], ['gugelot', 'braun', '产品合作', 'collaboration'], ['braunBrothers', 'braun', '企业基础', 'personInstitution'],
  ['isotype', 'neurath', '图像统计', 'personTheory'], ['bertin', 'semiology', '理论建构', 'personTheory'], ['tufte', 'visualDisplay', '数据可视化', 'personTheory'], ['wurman', 'infoAnxiety', '概念提出', 'personTheory'], ['wiener', 'cybernetics', '理论奠基', 'personTheory'], ['bense', 'infoAesthetics', '理论发展', 'personTheory'], ['mcluhan', 'understandingMedia', '著作', 'personTheory'], ['mcluhan', 'mediumMessage', '核心命题', 'personTheory'], ['mcluhan', 'globalVillage', '传播观念', 'personTheory'], ['bonsiepe', 'systems', '设计方法', 'thought'], ['bonsiepe', 'interfaceTheory', '界面转译', 'thought'], ['cybersyn', 'cybernetics', '实践应用', 'practiceProject'], ['infoTheory', 'infoAesthetics', '理论支撑', 'influence'], ['yale', 'tufte', '出版传播', 'personInstitution'], ['ted', 'wurman', '公共传播', 'personInstitution'], ['mit', 'wiener', '技术语境', 'personInstitution'], ['stuttgart', 'bense', '理论语境', 'personInstitution'], ['toronto', 'mcluhan', '媒介研究', 'personInstitution'],
  ['hfg', 'braun', '乌尔姆方法落地', 'practiceProject'], ['hfg', 'rams', '方法影响', 'influence'], ['wiener', 'bonsiepe', '系统思想影响', 'influence'], ['mcluhan', 'interfaceTheory', '媒介思想延展', 'discourse'],
]

const edges = edgeRows.map(([source, target, label, type], index) => ({ id: `edge-${index}`, source, target, label, type }))

function defaultLayoutNode(node) {
  if (node.zone === 'academy') {
    return { ...node, x: node.x + 80, y: node.y - 8 }
  }
  if (node.zone === 'practice') {
    return { ...node, x: node.x + 115, y: node.y + 42 }
  }
  if (node.zone === 'theory') {
    const direction = node.x < 0 ? -1 : 1
    return { ...node, x: Math.round(node.x * 1.1 + direction * 36), y: node.y + 18 }
  }
  return node
}

function readSavedPositions() {
  try {
    return JSON.parse(localStorage.getItem(NODE_POSITION_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function createInitialNodes() {
  const saved = readSavedPositions()
  return baseNodes.map((node) => {
    const laidOut = defaultLayoutNode(node)
    const savedPosition = saved[node.id]
    return {
      ...laidOut,
      ...(savedPosition ? { x: savedPosition.x, y: savedPosition.y } : {}),
      image: visualPlaceholder(node),
      imageSource: 'Wikimedia Commons fallback',
      imageAttribution: node.commonsSearch || node.wikiTitle || node.en,
      imageLicense: '加载中',
    }
  })
}

function saveNodePositions(nodes) {
  const positions = Object.fromEntries(nodes.map((node) => [node.id, { x: Math.round(node.x), y: Math.round(node.y) }]))
  localStorage.setItem(NODE_POSITION_STORAGE_KEY, JSON.stringify(positions))
}

function resetSavedPositions() {
  localStorage.removeItem(NODE_POSITION_STORAGE_KEY)
}

async function fetchWikiImage(title) {
  if (!title) return null
  try {
    const response = await fetch(`${WIKI_REST}${encodeURIComponent(title)}`)
    if (response.ok) {
      const data = await response.json()
      const image = data.originalimage?.source || data.thumbnail?.source
      if (image) {
        return {
          image,
          imageSource: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          imageAttribution: data.titles?.normalized || title,
          imageLicense: 'Wikipedia / Wikimedia',
        }
      }
    }
  } catch {
    // Try the Action API next.
  }

  try {
    const url = `${WIKI_API}?action=query&origin=*&format=json&prop=pageimages&pithumbsize=800&titles=${encodeURIComponent(title)}`
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      const page = Object.values(data.query?.pages || {})[0]
      if (page?.thumbnail?.source) {
        return {
          image: page.thumbnail.source,
          imageSource: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || title)}`,
          imageAttribution: page.title || title,
          imageLicense: 'Wikipedia page image',
        }
      }
    }
  } catch {
    return null
  }

  return null
}

async function fetchCommonsImage(searchTerm) {
  if (!searchTerm) return null
  try {
    const url = `${COMMONS_API}?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    const page = Object.values(data.query?.pages || {})[0]
    const info = page?.imageinfo?.[0]
    if (!info?.thumburl && !info?.url) return null
    const meta = info.extmetadata || {}
    return {
      image: info.thumburl || info.url,
      imageSource: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || searchTerm)}`,
      imageAttribution: meta.Artist?.value?.replace(/<[^>]*>/g, '') || page.title || searchTerm,
      imageLicense: meta.LicenseShortName?.value || 'Wikimedia Commons',
    }
  } catch {
    return null
  }
}

function relatedFallback(node) {
  if (stableFallbackById[node.id]) return stableFallbackById[node.id]
  if (node.zone === 'academy') return fallbackImages.institution
  if (node.zone === 'practice') return fallbackImages.work
  if (node.id === 'cybersyn') return fallbackImages.project
  return fallbackImages.theory
}

function visualPlaceholder(node) {
  const color = zoneMeta[node.zone]?.color || '#6f91d9'
  const letter = (node.zh || node.en || '?').slice(0, 2)
  const type = nodeTypeNames[node.type] || '节点'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${color}" stop-opacity=".82"/>
          <stop offset=".56" stop-color="#ffffff" stop-opacity=".72"/>
          <stop offset="1" stop-color="#d7dde8" stop-opacity=".88"/>
        </linearGradient>
        <filter id="b"><feGaussianBlur stdDeviation="28"/></filter>
      </defs>
      <rect width="800" height="800" fill="#f6f1e8"/>
      <circle cx="250" cy="230" r="250" fill="${color}" opacity=".22" filter="url(#b)"/>
      <circle cx="620" cy="590" r="310" fill="#ffffff" opacity=".62" filter="url(#b)"/>
      <rect x="116" y="118" width="568" height="564" rx="96" fill="url(#g)" stroke="rgba(255,255,255,.8)" stroke-width="10"/>
      <text x="400" y="388" text-anchor="middle" font-family="Arial, sans-serif" font-size="156" font-weight="700" fill="#253244">${letter}</text>
      <text x="400" y="482" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#4e5b70">${type}</text>
    </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function handleImageError(event, node) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return
  event.currentTarget.dataset.fallbackApplied = 'true'
  event.currentTarget.src = visualPlaceholder(node)
}

async function resolveNodeImage(node) {
  if (fixedImageById[node.id]) {
    return fixedImageById[node.id]
  }

  const wiki = await fetchWikiImage(node.wikiTitle)
  if (wiki) {
    return wiki
  }
  const commons = await fetchCommonsImage(node.commonsSearch || node.wikiTitle || node.en)
  if (commons) {
    return commons
  }
  return {
    image: relatedFallback(node),
    imageSource: `https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(node.commonsSearch || node.wikiTitle || node.en)}`,
    imageAttribution: `${node.zh} 相关 Wikimedia fallback`,
    imageLicense: 'Wikimedia Commons fallback',
  }
}

function preloadNodeImages(nodes, setNodes) {
  nodes.forEach(async (node) => {
    const resolved = await resolveNodeImage(node)
    const probe = new Image()
    probe.onload = () => setNodes((prev) => prev.map((item) => (item.id === node.id ? { ...item, ...resolved } : item)))
    probe.onerror = () => setNodes((prev) => prev.map((item) => (item.id === node.id ? {
      ...item,
      image: visualPlaceholder(item),
      imageSource: resolved.imageSource,
      imageAttribution: resolved.imageAttribution,
      imageLicense: resolved.imageLicense,
    } : item)))
    probe.src = resolved.image
  })
}

function edgePath(a, b) {
  const start = edgePoint(a, b)
  const end = edgePoint(b, a)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const bend = Math.min(135, distance * 0.16)
  const cx = (start.x + end.x) / 2 - (dy / distance) * bend
  const cy = (start.y + end.y) / 2 + (dx / distance) * bend
  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`
}

function edgeLabelPosition(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distance = Math.hypot(dx, dy) || 1
  return {
    x: (a.x + b.x) / 2 - (dy / distance) * 18,
    y: (a.y + b.y) / 2 + (dx / distance) * 18,
  }
}

function nodeSize(node) {
  if (['stuttgart', 'toronto'].includes(node.id)) return [166, 68]
  if (['mit', 'yale', 'ted'].includes(node.id)) return [184, 76]
  if (node.type === 'institution') {
    const important = ['hfg', 'braun', 'bauhaus'].includes(node.id)
    const diameter = important ? 142 : 126
    return [diameter, diameter]
  }
  if (node.type === 'person') return [312, 112]
  const wide = node.zh.length > 8 || node.en.length > 28
  return [wide ? 232 : 210, wide ? 88 : 78]
}

function buildZoneShape(zone, nodes) {
  const zoneNodes = nodes.filter((node) => node.zone === zone.id)
  if (!zoneNodes.length) return { ...zone, path: zone.path, label: zone.label }

  const padding = zone.id === 'theory' ? 170 : 150
  const bounds = zoneNodes.reduce((box, node) => {
    const [w, h] = nodeSize(node)
    return {
      minX: Math.min(box.minX, node.x - w / 2),
      maxX: Math.max(box.maxX, node.x + w / 2),
      minY: Math.min(box.minY, node.y - h / 2),
      maxY: Math.max(box.maxY, node.y + h / 2),
    }
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

  const x1 = bounds.minX - padding
  const x2 = bounds.maxX + padding
  const y1 = bounds.minY - padding
  const y2 = bounds.maxY + padding
  const width = x2 - x1
  const height = y2 - y1
  const wobble = Math.min(85, Math.max(44, width * 0.06))
  const path = [
    `M ${x1 + width * 0.18} ${y1 + wobble * 0.25}`,
    `C ${x1 + width * 0.34} ${y1 - wobble} ${x1 + width * 0.75} ${y1 - wobble * 0.62} ${x2 - width * 0.12} ${y1 + height * 0.12}`,
    `C ${x2 + wobble} ${y1 + height * 0.26} ${x2 + wobble * 0.6} ${y1 + height * 0.75} ${x2 - width * 0.08} ${y2 - height * 0.12}`,
    `C ${x1 + width * 0.73} ${y2 + wobble * 0.86} ${x1 + width * 0.29} ${y2 + wobble * 0.7} ${x1 + width * 0.1} ${y2 - height * 0.14}`,
    `C ${x1 - wobble * 0.78} ${y1 + height * 0.67} ${x1 - wobble * 0.72} ${y1 + height * 0.25} ${x1 + width * 0.18} ${y1 + wobble * 0.25}`,
    'Z',
  ].join(' ')

  return {
    ...zone,
    path,
    label: { x: x1 + 54, y: y1 + 74 },
  }
}

function edgePoint(from, to) {
  const [w, h] = nodeSize(from)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  if (from.type === 'institution' && !isCompactInstitution(from)) {
    const radius = w / 2 + 8
    return { x: from.x + (dx / distance) * radius, y: from.y + (dy / distance) * radius }
  }
  const scale = Math.min((w / 2 + 10) / Math.abs(dx || 1), (h / 2 + 10) / Math.abs(dy || 1))
  return { x: from.x + dx * scale, y: from.y + dy * scale }
}

function worldToScreen(point, view) {
  return {
    x: point.x * view.scale + view.x,
    y: point.y * view.scale + view.y,
  }
}

function screenToWorld(point, view) {
  return {
    x: (point.x - view.x) / view.scale,
    y: (point.y - view.y) / view.scale,
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getFloatingCardPosition(selectedNode, view, offset = { x: 0, y: 0 }) {
  if (!selectedNode) return null
  const nodeScreen = worldToScreen({ x: selectedNode.x, y: selectedNode.y }, view)
  const cardWidth = clamp(window.innerWidth * 0.24, 340, 420)
  const cardHeight = Math.min(window.innerHeight * 0.82, 620)
  const x = window.innerWidth - cardWidth - 24
  const y = Math.max(86, (window.innerHeight - cardHeight) / 2)

  return {
    x: clamp(x + offset.x, 16, window.innerWidth - cardWidth - 16),
    y: clamp(y + offset.y, 16, window.innerHeight - cardHeight - 16),
    width: cardWidth,
    height: cardHeight,
    nodeScreen,
  }
}

function placeBubble(nodeScreen, preferred, size) {
  const margin = 16
  let x = nodeScreen.x + preferred.x
  let y = nodeScreen.y + preferred.y
  if (x + size.width > window.innerWidth - margin) x = nodeScreen.x - Math.abs(preferred.x) - size.width
  if (x < margin) x = nodeScreen.x + Math.abs(preferred.x)
  return {
    x: clamp(x, margin, window.innerWidth - size.width - margin),
    y: clamp(y, margin, window.innerHeight - size.height - margin),
    width: size.width,
    height: size.height,
  }
}

function getFloatingBubbleLayout(selectedNode, relatedEdges, view) {
  if (!selectedNode) return []
  const nodeScreen = worldToScreen({ x: selectedNode.x, y: selectedNode.y }, view)
  const items = [
    { id: 'title', preferred: { x: 90, y: -142 }, size: { width: 278, height: 104 } },
    selectedNode.summary ? { id: 'desc', preferred: { x: 120, y: -12 }, size: { width: 286, height: 142 } } : null,
    selectedNode.tags?.length ? { id: 'keywords', preferred: { x: -42, y: 122 }, size: { width: 260, height: 112 } } : null,
    { id: 'meta', preferred: { x: -266, y: 58 }, size: { width: 246, height: 132 } },
    relatedEdges.length ? { id: 'relations', preferred: { x: -286, y: -124 }, size: { width: 292, height: 214 } } : null,
  ].filter(Boolean)

  return items.map((item) => ({
    ...item,
    ...placeBubble(nodeScreen, item.preferred, item.size),
    anchor: nodeScreen,
  }))
}

function getExpandedRelatedPosition(node, index, total, selectedNode) {
  const groupAngles = {
    institution: -150,
    person: -58,
    work: 6,
    project: 24,
    theory: 96,
    concept: 116,
  }
  const baseAngle = groupAngles[node.type] ?? (index / Math.max(total, 1)) * 360
  const spread = total > 1 ? (index - (total - 1) / 2) * 22 : 0
  const ring = index > 5 ? 310 : 224
  const angle = ((baseAngle + spread) * Math.PI) / 180
  return {
    x: selectedNode.x + Math.cos(angle) * ring,
    y: selectedNode.y + Math.sin(angle) * ring,
  }
}

function nodeLayerType(node) {
  if (node.type === 'person') return 'person'
  if (node.type === 'institution') return 'institution'
  if (node.type === 'work' || node.type === 'project') return 'work'
  return 'theory'
}

function selectedLayoutAnchors(selectedNode) {
  const selectedType = nodeLayerType(selectedNode)
  if (selectedType === 'person') {
    return {
      institution: { x: -315, y: -15 },
      work: { x: 330, y: 20 },
      theory: { x: 0, y: 285 },
      person: { x: 120, y: -255 },
    }
  }
  if (selectedType === 'institution') {
    return {
      person: { x: 0, y: -270 },
      work: { x: 335, y: 80 },
      theory: { x: 0, y: 295 },
      institution: { x: -315, y: 35 },
    }
  }
  if (selectedType === 'theory') {
    return {
      person: { x: 0, y: -270 },
      institution: { x: -320, y: -20 },
      work: { x: 320, y: 35 },
      theory: { x: 0, y: 280 },
    }
  }
  return {
    person: { x: -160, y: -260 },
    institution: { x: -330, y: -10 },
    work: { x: 325, y: 30 },
    theory: { x: 0, y: 285 },
  }
}

function layeredGroupPosition(center, anchor, index, count) {
  const spacing = 190
  const rowGap = 126
  const columns = Math.min(3, Math.max(1, count))
  const row = Math.floor(index / columns)
  const col = index % columns
  const colOffset = (col - (columns - 1) / 2) * spacing
  const rowDirection = anchor.y < 0 ? -1 : 1
  return {
    x: center.x + anchor.x + colOffset,
    y: center.y + anchor.y + row * rowGap * rowDirection,
  }
}

function getDetailLayoutPositions(selectedId, nodes, graphEdges) {
  if (!selectedId) return nodes
  const selectedNode = nodes.find((node) => node.id === selectedId)
  if (!selectedNode) return nodes

  const selectedEdges = graphEdges.filter((edge) => edge.source === selectedId || edge.target === selectedId)
  const directIds = new Set(selectedEdges.flatMap((edge) => [edge.source, edge.target]))
  const relatedNodes = nodes.filter((node) => node.id !== selectedId && directIds.has(node.id))
  const anchors = selectedLayoutAnchors(selectedNode)
  const grouped = relatedNodes.reduce((groups, node) => {
    const layer = nodeLayerType(node)
    return { ...groups, [layer]: [...(groups[layer] || []), node] }
  }, {})

  const nextById = new Map([[selectedId, { x: selectedNode.x, y: selectedNode.y }]])
  Object.entries(grouped).forEach(([layer, group]) => {
    group.forEach((node, index) => {
      nextById.set(node.id, layeredGroupPosition(selectedNode, anchors[layer], index, group.length))
    })
  })

  return nodes.map((node) => {
    if (nextById.has(node.id)) return { ...node, ...nextById.get(node.id) }
    const dx = node.x - selectedNode.x
    const dy = node.y - selectedNode.y
    const distance = Math.hypot(dx, dy) || 1
    if (distance > 520) return node
    const push = (1 - distance / 520) * 95
    return {
      ...node,
      x: node.x + (dx / distance) * push,
      y: node.y + (dy / distance) * push,
    }
  })
}

function getDisplayedNodes(nodes, selectedId, detailMode) {
  return detailMode ? getDetailLayoutPositions(selectedId, nodes, edges) : nodes
}

function isCompactInstitution(node) {
  return node?.type === 'institution' && ['mit', 'yale', 'ted', 'stuttgart', 'toronto'].includes(node.id)
}

function nodeRenderType(node) {
  return isCompactInstitution(node) ? 'support' : node.type
}

function bubbleSize(node, level = 'compact') {
  if (level === 'full') return { width: 300, height: 220 }
  if (level === 'mini') return { width: node.zh.length > 8 ? 184 : 154, height: 76 }
  if (node.type === 'person') return { width: 246, height: 148 }
  if (node.type === 'institution' && !isCompactInstitution(node)) return { width: 252, height: 150 }
  if (node.type === 'work' || node.type === 'project') return { width: 224, height: 136 }
  return { width: 210, height: 130 }
}

function bubbleOffset(node, index = 0) {
  const drift = (index % 3) * 16
  if (node.type === 'institution' && !isCompactInstitution(node)) return { x: 92 + drift, y: 72 + drift * 0.35 }
  if (node.type === 'person') return { x: 140 + drift, y: -58 + drift * 0.3 }
  if (node.type === 'theory' || node.type === 'concept') return { x: -90 + drift * 0.5, y: -140 - drift }
  if (node.type === 'work' || node.type === 'project') return { x: -74 + drift, y: 96 + drift * 0.35 }
  return { x: 104 + drift, y: -70 }
}

function intersects(a, b) {
  const gap = 14
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y
}

function placeNodeBubble(node, view, index, placed, protectedRect, level = 'compact') {
  const anchor = worldToScreen({ x: node.x, y: node.y }, view)
  const size = bubbleSize(node, level)
  const baseOffset = bubbleOffset(node, index)
  const margin = 16
  const outwardX = baseOffset.x >= 0 ? 1 : -1
  const outwardY = baseOffset.y >= 0 ? 1 : -1
  let candidate = null

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const step = attempt * 32
    const x = clamp(anchor.x + baseOffset.x + outwardX * step, margin, window.innerWidth - size.width - margin)
    const y = clamp(anchor.y + baseOffset.y + outwardY * step, margin, window.innerHeight - size.height - margin)
    candidate = { ...size, x, y, anchor, hidden: false }
    if (!placed.some((item) => intersects(candidate, item)) && (!protectedRect || !intersects(candidate, protectedRect))) break
  }

  const stillOverlaps = placed.some((item) => intersects(candidate, item)) || (protectedRect && intersects(candidate, protectedRect))
  return { ...candidate, hidden: stillOverlaps }
}

function getNodeBubblePosition(node, view, index = 0, placed = [], protectedRect = null, level = 'compact') {
  return placeNodeBubble(node, view, index, placed, protectedRect, level)
}

const relationTypeNames = {
  personInstitution: '人物—机构',
  personWork: '人物—作品',
  personTheory: '人物—理论',
  collaboration: '合作关系',
  influence: '理论影响',
  thought: '思想谱系',
  practiceProject: '实践项目关系',
  discourse: '后续解读',
}

const edgeLabelFallbacks = {
  collaboration: '合作关系',
  influence: '理论影响',
  institution: '机构关联',
  personInstitution: '机构关联',
  personWork: '作品 / 理论',
  personTheory: '作品 / 理论',
  work: '作品 / 理论',
  project: '项目实践',
  practiceProject: '项目实践',
  lineage: '思想谱系',
  thought: '思想谱系',
  discourse: '后续解读',
}

function getNodeInfo(node, relationEdges = [], nodes = []) {
  const typeFallback = {
    person: `${node.zh}在图谱中连接人物、机构与方法线索，是理解该知识网络的关键角色。`,
    institution: `${node.zh}承担知识生产、设计教育或实践转译的机构角色。`,
    work: `${node.zh}体现了相关设计方法在具体作品中的表达。`,
    project: `${node.zh}是方法进入公共系统或产业实践的代表案例。`,
    theory: `${node.zh}为信息设计、系统方法或视觉表达提供理论支撑。`,
    concept: `${node.zh}帮助解释信息组织、媒介环境与界面转译。`,
  }
  const institutions = node.institutions || (node.type === 'person' ? [zoneMeta[node.zone]?.main].filter(Boolean) : [])
  const works = node.works || [node.role].filter(Boolean)
  const relationSummary = relationEdges.slice(0, 3).map((edge) => {
    const otherId = edge.source === node.id ? edge.target : edge.source
    const other = nodes.find((item) => item.id === otherId)
    return `${other?.zh || '相关节点'}：${edge.label || edgeLabelFallbacks[edge.type] || '关联'}`
  })

  return {
    desc: node.desc || node.summary || typeFallback[node.type] || `${node.zh}是图谱中的重要节点。`,
    keywords: node.keywords || node.tags || [nodeTypeNames[node.type], zoneMeta[node.zone]?.name].filter(Boolean),
    institutions,
    works,
    relationSummary,
  }
}

function wrapLabel(text, maxCharsPerLine = 10, maxLines = 2) {
  const source = String(text || '')
  const hasChinese = /[\u4e00-\u9fff]/.test(source)
  const units = hasChinese ? [...source] : source.split(/\s+/)
  const lines = []
  let current = ''

  units.forEach((unit) => {
    const next = hasChinese ? current + unit : [current, unit].filter(Boolean).join(' ')
    if ([...next].length > maxCharsPerLine && current) {
      lines.push(current)
      current = unit
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  const result = lines.slice(0, maxLines)
  if (lines.length > maxLines) result[maxLines - 1] = `${result[maxLines - 1].replace(/.$/, '')}…`
  return result
}

function GraphEdge({ edge, nodesById, active, dimmed, activeColor, showLabel }) {
  const a = nodesById[edge.source]
  const b = nodesById[edge.target]
  if (!a || !b) return null
  const mid = edgeLabelPosition(a, b)

  return (
    <g className={`${active ? 'edge-active' : ''} ${dimmed ? 'dimmed' : ''}`} style={{ '--active-edge': activeColor }}>
      <path className={`edge edge-${edge.type}`} d={edgePath(a, b)} markerEnd="url(#arrow)" />
      {active && showLabel && (
        <foreignObject x={mid.x - 66} y={mid.y - 18} width="132" height="38" className="edge-label-wrap">
          <div className="edge-label">{edge.label}</div>
        </foreignObject>
      )}
    </g>
  )
}

function EdgeLabel({ edge, nodesById, activeColor }) {
  const a = nodesById[edge.source]
  const b = nodesById[edge.target]
  if (!a || !b) return null
  const mid = edgeLabelPosition(a, b)
  const label = edge.label || edgeLabelFallbacks[edge.type] || '关联'

  return (
    <foreignObject x={mid.x - 78} y={mid.y - 17} width="156" height="36" className="edge-label-wrap">
      <div className="edge-label" style={{ '--active-edge': activeColor }}>{label}</div>
    </foreignObject>
  )
}

function GraphNode({ node, related, selected, dimmed, dragging, onNodePointerDown, onHover, onLeave }) {
  const size = nodeSize(node)
  const [w, h] = size
  const visualType = nodeRenderType(node)
  const zhLines = wrapLabel(node.zh, visualType === 'institution' ? 8 : visualType === 'person' ? 12 : 10, 2)

  return (
    <foreignObject x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} className={`node-wrap ${dimmed ? 'dimmed' : ''} ${dragging ? 'dragging' : ''}`}>
      <button
        className={`node node-${visualType} ${selected ? 'selected' : ''} ${related ? 'related' : ''} ${dragging ? 'dragging' : ''}`}
        style={{ '--node-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
        onPointerDown={(event) => {
          event.stopPropagation()
          onNodePointerDown(event, node)
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={(event) => onHover(node, event)}
        onMouseMove={(event) => onHover(node, event)}
        onMouseLeave={onLeave}
      >
        {visualType === 'institution' ? (
          <>
            <img src={node.image} alt={node.zh} onError={(event) => handleImageError(event, node)} />
            <span className="institution-shade" />
            <span className="node-copy">
              <strong>{zhLines.map((line) => <span key={line}>{line}</span>)}</strong>
              <small>{node.en}</small>
            </span>
          </>
        ) : (
          <>
            <img src={node.image} alt={node.zh} onError={(event) => handleImageError(event, node)} />
            <span className="node-copy">
              <strong>{zhLines.map((line) => <span key={line}>{line}</span>)}</strong>
              <small>{node.en}</small>
              <em>{node.role}</em>
            </span>
          </>
        )}
      </button>
    </foreignObject>
  )
}

function LiquidZone({ zone, muted, guided }) {
  return (
    <g className={`zone ${muted ? 'muted' : ''} ${guided ? 'guided' : ''}`}>
      <path d={zone.path} fill={zone.color} />
      <text x={zone.label.x} y={zone.label.y} className="zone-title">{zone.title}</text>
      <text x={zone.label.x} y={zone.label.y + 34} className="zone-subtitle">{zone.subtitle}</text>
    </g>
  )
}

function FloatingLegend({ activeFilter, onFilter, guide, onGuide, onStopGuide }) {
  return (
    <div className="legend glass">
      <div className="brand">
        <span>乌尔姆知识画布</span>
        <strong>人物—机构—作品—理论知识图谱</strong>
      </div>
      <div className="segmented" aria-label="板块筛选">
        {['all', 'academy', 'practice', 'theory'].map((id) => (
          <button key={id} className={activeFilter === id ? 'active' : ''} onClick={() => onFilter(id)}>
            {id === 'all' ? '全部' : zoneMeta[id].name}
          </button>
        ))}
      </div>
      <button className="guide-button" onClick={guide ? onStopGuide : onGuide}>{guide ? '停止导览' : '播放导览'}</button>
    </div>
  )
}

function Toolbar({ onFit, onZoomIn, onZoomOut, onClear, onResetLayout }) {
  return (
    <div className="toolbar glass" aria-label="画布工具">
      <button title="适应画布" onClick={onFit}>⌖</button>
      <button title="放大" onClick={onZoomIn}>＋</button>
      <button title="缩小" onClick={onZoomOut}>－</button>
      <button title="取消选中" onClick={onClear}>×</button>
      <button title="重置布局" onClick={onResetLayout}>↺</button>
    </div>
  )
}

function ModeControls({ detailMode, onDetailMode, showAllBubbles, onShowAllBubbles, showEdgeLabels, onShowEdgeLabels }) {
  return (
    <div className="mode-controls glass">
      <button className={detailMode ? 'active' : ''} onClick={() => onDetailMode((value) => !value)}>详情模式</button>
      {detailMode && (
        <button className={showAllBubbles ? 'active' : ''} onClick={() => onShowAllBubbles((value) => !value)}>全部信息气泡</button>
      )}
      <button className={showEdgeLabels ? 'active' : ''} onClick={() => onShowEdgeLabels((value) => !value)}>
        {showEdgeLabels ? '隐藏关系文字' : '关系文字'}
      </button>
    </div>
  )
}

function HoverPreview({ hover }) {
  if (!hover) return null
  return (
    <div className="hover-preview glass" style={{ left: hover.x, top: hover.y }}>
      <img src={hover.node.image} alt="" onError={(event) => handleImageError(event, hover.node)} />
      <div>
        <strong>{hover.node.zh}</strong>
        <span>{hover.node.en}</span>
        <p>{hover.node.summary}</p>
      </div>
    </div>
  )
}

function DraggableInfoPanel({ node, nodesById, relatedEdges, guideInfo, onSelect }) {
  const defaultPos = () => ({ x: Math.max(window.innerWidth - 392, 16), y: 92 })
  const [pos, setPos] = useState(defaultPos)
  const [collapsed, setCollapsed] = useState(false)
  const drag = useRef(null)
  const data = guideInfo || node

  useEffect(() => {
    const move = (event) => {
      if (!drag.current) return
      setPos({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y })
    }
    const up = () => {
      drag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  if (!data) return null

  const isNode = 'zone' in data
  return (
    <aside className={`info-panel glass ${collapsed ? 'collapsed' : ''}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} onPointerDown={(event) => event.stopPropagation()}>
      <div
        className="panel-drag"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX - pos.x, y: event.clientY - pos.y }
        }}
      >
        <span />
        <button onClick={() => setCollapsed((value) => !value)}>{collapsed ? '展开' : '折叠'}</button>
        <button onClick={() => setPos(defaultPos())}>回到右侧</button>
      </div>
      {!collapsed && (
        <div className="panel-body">
          {'image' in data && <img className="panel-image" src={data.image} alt={data.zh} onError={(event) => handleImageError(event, data)} />}
          <p className="panel-type">{isNode ? `${zoneMeta[data.zone]?.name || '知识节点'} · ${nodeTypeNames[data.type]}` : data.type}</p>
          <h2>{data.zh}</h2>
          <h3>{data.en}</h3>
          <p className="summary">{data.summary}</p>
          {isNode && (
            <dl>
              <div><dt>所属板块</dt><dd>{zoneMeta[data.zone]?.name}</dd></div>
              <div><dt>主要机构</dt><dd>{zoneMeta[data.zone]?.main}</dd></div>
              <div><dt>代表作品 / 理论</dt><dd>{data.role}</dd></div>
            </dl>
          )}
          <div className="chips">{(data.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
          {'imageSource' in data && (
            <a className="source" href={data.imageSource} target="_blank" rel="noreferrer">
              图片来源：{data.imageAttribution || 'Wikipedia / Wikimedia'} · {data.imageLicense || 'Commons'}
            </a>
          )}
          {relatedEdges.length > 0 && (
            <div className="relations">
              <strong>相关连接</strong>
              {relatedEdges.map((edge) => {
                const otherId = edge.source === data.id ? edge.target : edge.source
                const other = nodesById[otherId]
                return (
                  <button key={edge.id} onClick={() => onSelect(otherId)}>
                    <span>{edge.label}</span>
                    <em>{other?.zh}</em>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

function FloatingNodeInfoCard({ node, nodesById, relatedEdges, position, onSelect, onClose, onOffsetChange }) {
  const drag = useRef(null)

  useEffect(() => {
    const move = (event) => {
      if (!drag.current) return
      onOffsetChange({
        x: event.clientX - drag.current.startX + drag.current.offsetX,
        y: event.clientY - drag.current.startY + drag.current.offsetY,
      })
    }
    const up = () => {
      drag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [onOffsetChange])

  if (!node || !position) return null

  return (
    <aside
      className="floating-info-card glass"
      style={{ left: position.x, top: position.y, width: position.width, maxHeight: position.height }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="floating-card-drag"
        onPointerDown={(event) => {
          event.stopPropagation()
          drag.current = {
            startX: event.clientX,
            startY: event.clientY,
            offsetX: position.offsetX || 0,
            offsetY: position.offsetY || 0,
          }
        }}
      >
        <span />
        <button onClick={onClose}>关闭</button>
      </div>
      <div className="floating-card-body">
        <img className="floating-card-image" src={node.image} alt={node.zh} onError={(event) => handleImageError(event, node)} />
        <div className="floating-card-heading">
          <span className="floating-type">{nodeTypeNames[node.type]}</span>
          <h2>{node.zh}</h2>
          <h3>{node.en}</h3>
        </div>
        <dl className="floating-meta">
          <div><dt>所属板块</dt><dd>{zoneMeta[node.zone]?.name}</dd></div>
          <div><dt>主要机构</dt><dd>{zoneMeta[node.zone]?.main}</dd></div>
          <div><dt>代表作品 / 理论</dt><dd>{node.role}</dd></div>
        </dl>
        <p className="floating-summary">{node.summary}</p>
        <div className="chips">{(node.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <a className="source" href={node.imageSource} target="_blank" rel="noreferrer">
          图片来源：{node.imageAttribution || 'Wikipedia / Wikimedia'} · {node.imageLicense || 'Commons'}
        </a>
        {relatedEdges.length > 0 && (
          <div className="floating-relations">
            <strong>相关连接</strong>
            {relatedEdges.map((edge) => {
              const otherId = edge.source === node.id ? edge.target : edge.source
              const other = nodesById[otherId]
              return (
                <button key={edge.id} onClick={() => onSelect(otherId)}>
                  <span>{relationTypeNames[edge.type] || '关系'}</span>
                  <em>{other?.zh}</em>
                  <small>{edge.label}</small>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

function FloatingInfoBubbles({ node, nodesById, relatedEdges, bubbles, onSelect, onClose }) {
  if (!node || !bubbles.length) return null
  const byId = Object.fromEntries(bubbles.map((bubble) => [bubble.id, bubble]))
  const relationRows = relatedEdges.slice(0, 4)

  return (
    <div className="bubble-layer" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <svg className="bubble-tethers" aria-hidden="true">
        {bubbles.map((bubble) => (
          <line
            key={bubble.id}
            x1={bubble.anchor.x}
            y1={bubble.anchor.y}
            x2={bubble.x + bubble.width / 2}
            y2={bubble.y + bubble.height / 2}
            style={{ '--bubble-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
          />
        ))}
      </svg>

      {byId.title && (
        <div className="info-bubble title-bubble" style={{ left: byId.title.x, top: byId.title.y, width: byId.title.width }}>
          <button className="bubble-close" onClick={onClose}>×</button>
          <img src={node.image} alt={node.zh} onError={(event) => handleImageError(event, node)} />
          <div>
            <span className="bubble-type">{nodeTypeNames[node.type]}</span>
            <strong>{node.zh}</strong>
            <small>{node.en}</small>
          </div>
        </div>
      )}

      {byId.desc && (
        <div className="info-bubble desc-bubble" style={{ left: byId.desc.x, top: byId.desc.y, width: byId.desc.width }}>
          <h4>简介</h4>
          <p>{node.summary}</p>
        </div>
      )}

      {byId.keywords && (
        <div className="info-bubble keyword-bubble" style={{ left: byId.keywords.x, top: byId.keywords.y, width: byId.keywords.width }}>
          <h4>关键词</h4>
          <div className="bubble-chips">{node.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
      )}

      {byId.meta && (
        <div className="info-bubble meta-bubble" style={{ left: byId.meta.x, top: byId.meta.y, width: byId.meta.width }}>
          <h4>相关内容</h4>
          <dl>
            <div><dt>主要机构</dt><dd>{zoneMeta[node.zone]?.main}</dd></div>
            <div><dt>代表作品 / 理论</dt><dd>{node.role}</dd></div>
          </dl>
        </div>
      )}

      {byId.relations && (
        <div className="info-bubble relation-bubble" style={{ left: byId.relations.x, top: byId.relations.y, width: byId.relations.width }}>
          <h4>关系路径</h4>
          <div className="bubble-relations">
            {relationRows.map((edge) => {
              const otherId = edge.source === node.id ? edge.target : edge.source
              const other = nodesById[otherId]
              return (
                <button key={edge.id} onClick={() => onSelect(otherId)}>
                  <span>{relationTypeNames[edge.type] || '关系'}</span>
                  <em>{other?.zh}</em>
                  <small>{edge.label}</small>
                </button>
              )
            })}
            {relatedEdges.length > 4 && <p>更多关系…</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function NodeInfoBubble({ node, position, selected, related, dimmed, onClose, onSelect }) {
  if (!node || !position) return null
  const metaItems = [
    zoneMeta[node.zone]?.main,
    node.role,
  ].filter(Boolean).slice(0, 2)

  return (
    <article
      className={`node-info-bubble ${selected ? 'selected' : ''} ${related ? 'related' : ''} ${dimmed ? 'dimmed' : ''}`}
      style={{ left: position.x, top: position.y, width: position.width, height: position.height, '--bubble-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(node.id)
      }}
    >
      {selected && <button className="node-bubble-close" onClick={(event) => { event.stopPropagation(); onClose() }}>×</button>}
      <div className="node-bubble-head">
        <img src={node.image} alt={node.zh} onError={(event) => handleImageError(event, node)} />
        <div>
          <span>{nodeTypeNames[node.type]}</span>
          <strong>{node.zh}</strong>
          <small>{node.en}</small>
        </div>
      </div>
      <p>{node.summary}</p>
      <div className="node-bubble-chips">
        {(node.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="node-bubble-meta">
        {metaItems.map((item) => <em key={item}>{item}</em>)}
      </div>
    </article>
  )
}

function NodeInfoBubbleV2({ node, position, selected, related, dimmed, level, relationEdges = [], nodes, onClose, onSelect }) {
  if (!node || !position) return null
  const info = getNodeInfo(node, relationEdges, nodes)
  const metaItems = [...info.institutions, ...info.works].filter(Boolean).slice(0, level === 'full' ? 4 : 1)
  const relationRows = relationEdges.slice(0, 3)

  return (
    <article
      className={`node-info-bubble bubble-${level} ${selected ? 'selected' : ''} ${related ? 'related' : ''} ${dimmed ? 'dimmed' : ''}`}
      style={{ left: position.x, top: position.y, width: position.width, height: position.height, '--bubble-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(node.id)
      }}
    >
      {selected && <button className="node-bubble-close" onClick={(event) => { event.stopPropagation(); onClose() }}>×</button>}
      <div className="node-bubble-head">
        <div>
          <span>{level === 'full' ? '补充说明' : nodeTypeNames[node.type]}</span>
          <strong>{node.zh}</strong>
          {level === 'full' && <small>{node.en}</small>}
        </div>
      </div>
      {level !== 'mini' && <p>{info.desc}</p>}
      {level === 'mini' && <p>{info.desc || info.keywords[0]}</p>}
      {level !== 'mini' && (
        <div className="node-bubble-chips">
          {info.keywords.slice(0, level === 'full' ? 4 : 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      )}
      {level === 'compact' && relationRows[0] && (
        <div className="node-bubble-relations compact-relation">
          <span>{relationRows[0].label || edgeLabelFallbacks[relationRows[0].type] || '相关连接'}</span>
        </div>
      )}
      {level === 'full' && (
        <>
          <div className="node-bubble-meta">
            {metaItems.map((item) => <em key={item}>{item}</em>)}
          </div>
          {relationRows.length > 0 && (
            <div className="node-bubble-relations">
              {relationRows.map((edge) => {
                const otherId = edge.source === node.id ? edge.target : edge.source
                const other = nodes.find((item) => item.id === otherId)
                return <span key={edge.id}>{other?.zh}：{edge.label}</span>
              })}
            </div>
          )}
        </>
      )}
    </article>
  )
}

function InfoBubble({ node, position, selected, related, dimmed, level, relationEdges = [], nodes, onClose, onSelect }) {
  if (!node || !position) return null
  const info = getNodeInfo(node, relationEdges, nodes)
  const relationRows = relationEdges.slice(0, 3)
  const metaItems = [...info.institutions, ...info.works].filter(Boolean).slice(0, level === 'full' ? 4 : 1)

  return (
    <article
      className={`node-info-bubble bubble-${level} ${selected ? 'selected' : ''} ${related ? 'related' : ''} ${dimmed ? 'dimmed' : ''}`}
      style={{ left: position.x, top: position.y, width: position.width, height: position.height, '--bubble-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(node.id)
      }}
    >
      {selected && <button className="node-bubble-close" onClick={(event) => { event.stopPropagation(); onClose() }}>×</button>}
      <div className="node-bubble-head">
        <div>
          <span>{level === 'full' ? '补充信息' : level === 'compact' ? '关系摘要' : '简注'}</span>
          <strong>{node.zh}</strong>
          {level === 'full' && <small>{node.en}</small>}
        </div>
      </div>
      <p>{info.desc}</p>
      {level !== 'mini' && (
        <div className="node-bubble-chips">
          {info.keywords.slice(0, level === 'full' ? 4 : 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      )}
      {level === 'compact' && relationRows[0] && (
        <div className="node-bubble-relations compact-relation">
          <span>{relationRows[0].label || edgeLabelFallbacks[relationRows[0].type] || '相关连接'}</span>
        </div>
      )}
      {level === 'full' && (
        <>
          <div className="node-bubble-meta">
            {metaItems.map((item) => <em key={item}>{item}</em>)}
          </div>
          {relationRows.length > 0 && (
            <div className="node-bubble-relations">
              {relationRows.map((edge) => {
                const otherId = edge.source === node.id ? edge.target : edge.source
                const other = nodes.find((item) => item.id === otherId)
                return <span key={edge.id}>{other?.zh || '相关节点'}：{edge.label || edgeLabelFallbacks[edge.type] || '关联'}</span>
              })}
            </div>
          )}
        </>
      )}
    </article>
  )
}

function DetailBubbleLayer({ nodes, view, selectedId, relatedIds, showAllBubbles, selectedEdges, onSelect, onClose }) {
  if (!showAllBubbles && !selectedId) return null
  const relatedNodeIds = selectedEdges.map((edge) => (edge.source === selectedId ? edge.target : edge.source)).slice(0, 6)
  const visibleNodes = showAllBubbles
    ? nodes
    : nodes.filter((node) => node.id === selectedId || relatedNodeIds.includes(node.id))
  const indexed = new Map()
  const placed = []
  const selectedNode = nodes.find((node) => node.id === selectedId)
  const selectedAnchor = selectedNode ? worldToScreen({ x: selectedNode.x, y: selectedNode.y }, view) : null
  const selectedSize = selectedNode ? nodeSize(selectedNode) : [0, 0]
  const selectedProtectedRect = selectedAnchor ? {
    x: selectedAnchor.x - (selectedSize[0] * view.scale) / 2 - 16,
    y: selectedAnchor.y - (selectedSize[1] * view.scale) / 2 - 16,
    width: selectedSize[0] * view.scale + 32,
    height: selectedSize[1] * view.scale + 32,
  } : null

  const bubbleItems = visibleNodes.map((node) => {
    const key = `${node.zone}-${nodeLayerType(node)}`
    const index = indexed.get(key) || 0
    indexed.set(key, index + 1)
    const level = selectedId === node.id ? 'full' : relatedIds.has(node.id) ? 'compact' : 'mini'
    const position = getNodeBubblePosition(node, view, index, placed, selectedProtectedRect, level)
    if (!position.hidden || selectedId === node.id) placed.push(position)
    return {
      node,
      position: selectedId === node.id ? { ...position, hidden: false } : position,
      level,
      relationEdges: selectedId === node.id ? selectedEdges : selectedEdges.filter((edge) => edge.source === node.id || edge.target === node.id),
      selected: selectedId === node.id,
      related: relatedIds.has(node.id),
      dimmed: Boolean(showAllBubbles && selectedId && !relatedIds.has(node.id)),
    }
  }).filter((item) => !item.position.hidden || item.selected)

  const relationBubble = false && !showAllBubbles && selectedId && selectedEdges.length ? (() => {
    const node = nodes.find((item) => item.id === selectedId)
    if (!node) return null
    const anchor = worldToScreen({ x: node.x, y: node.y }, view)
    const width = 238
    const height = 132
    return {
      x: clamp(anchor.x - width - 116, 16, window.innerWidth - width - 16),
      y: clamp(anchor.y + 58, 16, window.innerHeight - height - 16),
      width,
      height,
      anchor,
    }
  })() : null

  return (
    <div className="node-bubble-layer" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <svg className="bubble-tethers" aria-hidden="true">
        {bubbleItems.map(({ node, position }) => (
          <line
            key={node.id}
            x1={position.anchor.x}
            y1={position.anchor.y}
            x2={position.x + position.width / 2}
            y2={position.y + position.height / 2}
            style={{ '--bubble-color': zoneMeta[node.zone]?.color || '#6f91d9' }}
          />
        ))}
        {relationBubble && (
          <line
            x1={relationBubble.anchor.x}
            y1={relationBubble.anchor.y}
            x2={relationBubble.x + relationBubble.width / 2}
            y2={relationBubble.y + relationBubble.height / 2}
            style={{ '--bubble-color': zoneMeta[nodes.find((node) => node.id === selectedId)?.zone]?.color || '#6f91d9' }}
          />
        )}
      </svg>
      {bubbleItems.map((item) => (
        <InfoBubble key={item.node.id} {...item} nodes={nodes} onSelect={onSelect} onClose={onClose} />
      ))}
      {relationBubble && (
        <div className="relation-mini-bubble" style={{ left: relationBubble.x, top: relationBubble.y, width: relationBubble.width }}>
          <strong>关系路径</strong>
          {selectedEdges.slice(0, 3).map((edge) => {
            const otherId = edge.source === selectedId ? edge.target : edge.source
            const other = nodes.find((node) => node.id === otherId)
            return (
              <button key={edge.id} onClick={() => onSelect(otherId)}>
                <span>{relationTypeNames[edge.type] || '关系'}</span>
                <em>{other?.zh}</em>
                <small>{edge.label}</small>
              </button>
            )
          })}
          {selectedEdges.length > 3 && <p>更多关系…</p>}
        </div>
      )}
    </div>
  )
}

function InfiniteCanvas() {
  const [nodes, setNodes] = useState(createInitialNodes)
  const [view, setView] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 70, scale: 0.62 })
  const [selectedId, setSelectedId] = useState('hfg')
  const [hover, setHover] = useState(null)
  const [filter, setFilter] = useState('all')
  const [guide, setGuide] = useState(null)
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [detailMode, setDetailMode] = useState(false)
  const [showAllBubbles, setShowAllBubbles] = useState(false)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 })
  const drag = useRef(null)
  const nodeDrag = useRef(null)
  const svgRef = useRef(null)
  const guideTimer = useRef(null)
  const viewRef = useRef(view)

  const nodesById = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node])), [nodes])
  const selectedNode = selectedId ? nodesById[selectedId] : null
  const selectedEdges = useMemo(() => edges.filter((edge) => edge.source === selectedId || edge.target === selectedId), [selectedId])
  const relatedIds = useMemo(() => new Set([selectedId, ...selectedEdges.flatMap((edge) => [edge.source, edge.target])]), [selectedEdges, selectedId])
  const activeColor = selectedNode ? zoneMeta[selectedNode.zone]?.color || '#6f91d9' : '#6f91d9'
  const floatingCardPosition = useMemo(() => getFloatingCardPosition(selectedNode, view, cardOffset), [selectedNode, view, cardOffset])
  const bubbleLayout = useMemo(() => getFloatingBubbleLayout(selectedNode, selectedEdges, view), [selectedNode, selectedEdges, view])
  const displayedNodes = useMemo(() => (
    draggingNodeId ? nodes : getDisplayedNodes(nodes, selectedId, detailMode)
  ), [nodes, selectedId, detailMode, draggingNodeId])
  const displayedNodesById = useMemo(() => Object.fromEntries(displayedNodes.map((node) => [node.id, node])), [displayedNodes])
  const labelEdges = useMemo(() => {
    if (!showEdgeLabels) return []
    if (selectedId) return selectedEdges

    const bridgeIds = new Set(['aicher', 'gugelot', 'bonsiepe'])
    const visibleNodeIds = new Set(
      nodes
        .filter((node) => filter === 'all' || node.zone === filter || bridgeIds.has(node.id))
        .map((node) => node.id),
    )
    return edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
  }, [filter, nodes, selectedEdges, selectedId, showEdgeLabels])
  const dynamicZones = useMemo(() => zones.map((zone) => buildZoneShape(zone, nodes)), [nodes])

  useEffect(() => {
    preloadNodeImages(baseNodes, setNodes)
  }, [])

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    setCardOffset({ x: 0, y: 0 })
  }, [selectedId])

  useEffect(() => {
    if (!detailMode) setShowAllBubbles(false)
  }, [detailMode])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const fit = useCallback(() => {
    setView({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 80,
      scale: Math.min(window.innerWidth / 2850, window.innerHeight / 2050, 0.72),
    })
  }, [])

  useEffect(() => {
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fit])

  useEffect(() => {
    const move = (event) => {
      const current = nodeDrag.current
      if (!current) return
      event.preventDefault()
      const scale = viewRef.current.scale
      const dx = (event.clientX - current.startClientX) / scale
      const dy = (event.clientY - current.startClientY) / scale
      const screenDistance = Math.hypot(event.clientX - current.startClientX, event.clientY - current.startClientY)
      if (screenDistance > 3) {
        current.moved = true
        setDraggingNodeId(current.id)
      }
      setNodes((prev) => prev.map((node) => (
        node.id === current.id ? { ...node, x: current.startX + dx, y: current.startY + dy } : node
      )))
    }

    const up = () => {
      const current = nodeDrag.current
      if (!current) return
      nodeDrag.current = null
      setDraggingNodeId(null)
      setNodes((prev) => {
        saveNodePositions(prev)
        return prev
      })
      if (!current.moved) {
        stopGuide()
        setSelectedId(current.id)
      }
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const setZoom = (factor) => setView((prev) => ({ ...prev, scale: Math.max(0.25, Math.min(1.45, prev.scale * factor)) }))

  const onWheel = (event) => {
    event.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    const factor = event.deltaY > 0 ? 0.92 : 1.08
    const nextScale = Math.max(0.25, Math.min(1.45, view.scale * factor))
    const worldX = (event.clientX - rect.left - view.x) / view.scale
    const worldY = (event.clientY - rect.top - view.y) / view.scale
    setView({
      scale: nextScale,
      x: event.clientX - rect.left - worldX * nextScale,
      y: event.clientY - rect.top - worldY * nextScale,
    })
  }

  const stopGuide = () => {
    window.clearInterval(guideTimer.current)
    setGuide(null)
  }

  const handleNodePointerDown = (event, node) => {
    event.preventDefault()
    event.stopPropagation()
    const realNode = nodesById[node.id] || node
    nodeDrag.current = {
      id: node.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: realNode.x,
      startY: realNode.y,
      moved: false,
    }
  }

  const resetLayout = () => {
    resetSavedPositions()
    setNodes((prev) => {
      const imageById = Object.fromEntries(prev.map((node) => [node.id, {
        image: node.image,
        imageSource: node.imageSource,
        imageAttribution: node.imageAttribution,
        imageLicense: node.imageLicense,
      }]))
      return baseNodes.map((node) => ({ ...defaultLayoutNode(node), ...(imageById[node.id] || {}) }))
    })
    setSelectedId('hfg')
    stopGuide()
    fit()
  }

  const startGuide = () => {
    stopGuide()
    const steps = [
      { id: 'academy', focus: 'hfg', zh: '学院体系：方法的形成', en: 'HfG Ulm as a methodological school', type: '导览', summary: '从 Bauhaus 到 HfG Ulm，设计从形式训练转向系统、科学与社会功能。', tags: ['方法形成', '教育', '系统'] },
      { id: 'practice', focus: 'braun', zh: '企业实践：方法的落地', en: 'Braun, Vitsœ and public visual systems', type: '导览', summary: '乌尔姆方法进入产品、企业识别与公共视觉系统，成为可验证的设计实践。', tags: ['产品系统', '企业', '公共视觉'] },
      { id: 'theory', focus: 'systems', zh: '理论研究：方法的支撑', en: 'Information theory, cybernetics and media thought', type: '导览', summary: '控制论、信息论、媒介理论和可视化理论共同解释信息设计的知识基础。', tags: ['理论支撑', '媒介', '控制论'] },
    ]
    let index = 0
    setGuide(steps[index])
    setSelectedId(steps[index].focus)
    guideTimer.current = window.setInterval(() => {
      index = (index + 1) % steps.length
      setGuide(steps[index])
      setSelectedId(steps[index].focus)
    }, 3000)
  }

  useEffect(() => () => window.clearInterval(guideTimer.current), [])

  const selectedDisplayNode = selectedId ? displayedNodesById[selectedId] : null
  const tetherStart = selectedDisplayNode ? worldToScreen({ x: selectedDisplayNode.x, y: selectedDisplayNode.y }, view) : null
  const tetherEnd = floatingCardPosition && tetherStart ? {
    x: clamp(floatingCardPosition.x, 16, window.innerWidth - 16),
    y: clamp(floatingCardPosition.y + 54, 16, window.innerHeight - 16),
  } : null

  return (
    <main className="app-shell">
      <FloatingLegend activeFilter={filter} onFilter={setFilter} guide={guide} onGuide={startGuide} onStopGuide={stopGuide} />
      <ModeControls
        detailMode={detailMode}
        onDetailMode={setDetailMode}
        showAllBubbles={showAllBubbles}
        onShowAllBubbles={setShowAllBubbles}
        showEdgeLabels={showEdgeLabels}
        onShowEdgeLabels={setShowEdgeLabels}
      />
      <Toolbar
        onFit={fit}
        onZoomIn={() => setZoom(1.16)}
        onZoomOut={() => setZoom(0.86)}
        onClear={() => { setSelectedId(null); stopGuide() }}
        onResetLayout={resetLayout}
      />
      <svg
        ref={svgRef}
        className="canvas"
        onWheel={onWheel}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX - view.x, y: event.clientY - view.y }
          svgRef.current.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const currentDrag = drag.current
          if (!currentDrag) return
          setView((prev) => ({ ...prev, x: event.clientX - currentDrag.x, y: event.clientY - currentDrag.y }))
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onClick={() => setSelectedId(null)}
      >
        <defs>
          <filter id="softBlur"><feGaussianBlur stdDeviation="18" /></filter>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" fill="currentColor" /></marker>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <g className="canvas-orbit">
            {dynamicZones.map((zone) => <LiquidZone key={zone.id} zone={zone} muted={filter !== 'all' && filter !== zone.id} guided={guide?.id === zone.id} />)}
          </g>
          <g className="edges">
            {edges.map((edge) => {
              const isActive = selectedEdges.some((item) => item.id === edge.id)
              return <GraphEdge key={edge.id} edge={edge} nodesById={displayedNodesById} active={isActive} dimmed={Boolean(selectedId && !isActive)} activeColor={activeColor} showLabel={false} />
            })}
          </g>
          <g className="edge-labels">
            {labelEdges.map((edge) => (
              <EdgeLabel key={`label-${edge.id}`} edge={edge} nodesById={displayedNodesById} activeColor={activeColor} />
            ))}
          </g>
          <g className="nodes">
            {displayedNodes.map((node) => {
              const bridge = ['aicher', 'gugelot', 'bonsiepe'].includes(node.id)
              const filtered = filter !== 'all' && node.zone !== filter && !bridge
              const selected = selectedId === node.id
              const related = relatedIds.has(node.id)
              const dimmed = filtered || Boolean(selectedId && !related)
              return (
                <GraphNode
                  key={node.id}
                  node={node}
                  selected={selected}
                  related={related}
                  dimmed={dimmed}
                  dragging={draggingNodeId === node.id}
                  onNodePointerDown={handleNodePointerDown}
                  onHover={(hoverNode, event) => setHover({ node: hoverNode, x: event.clientX + 18, y: event.clientY + 18 })}
                  onLeave={() => setHover(null)}
                />
              )
            })}
          </g>
        </g>
      </svg>
      {!detailMode && tetherStart && tetherEnd && (
        <svg className="floating-tether" aria-hidden="true">
          <line x1={tetherStart.x} y1={tetherStart.y} x2={tetherEnd.x} y2={tetherEnd.y} />
        </svg>
      )}
      <HoverPreview hover={hover} />
      {!detailMode && (
        <FloatingNodeInfoCard
          node={selectedNode}
          nodesById={nodesById}
          relatedEdges={selectedEdges}
          position={floatingCardPosition ? { ...floatingCardPosition, offsetX: cardOffset.x, offsetY: cardOffset.y } : null}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
          onOffsetChange={setCardOffset}
        />
      )}
      {detailMode && (
        <DetailBubbleLayer
          nodes={displayedNodes}
          view={view}
          selectedId={selectedId}
          relatedIds={relatedIds}
          showAllBubbles={showAllBubbles}
          selectedEdges={selectedEdges}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  )
}

export default function App() {
  return <InfiniteCanvas />
}

