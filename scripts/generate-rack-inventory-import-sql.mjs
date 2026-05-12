#!/usr/bin/env node

const SOURCE = 'pasted rack inventory 2026-05-11';

function d(u, type, model, serial = '', power = null, remarks = '', extra = {}) {
  return { u, type, model, serial, power, remarks, ...extra };
}

const racks = [
  {
    rack: 'RACK-1', label: 'LEMONN-DR', siteId: 'lemonn-prod', clientId: 'lemonn',
    devices: [
      d('45U', 'Firewall', 'Fortigate 120G', 'FG120GTK25008291', 40),
      d('44U', 'Firewall', 'Fortigate 120G', 'FG120GTK25008707', 40),
      d('43U', 'MGMT-Switch', 'Cisco C1300-48T-4G', 'PVN29151QUN', 33),
      d('42U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L6G7', 750),
      d('41U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L6GA', 750),
      d('40-39U', 'Server(KVM1)', 'HP DL385 Gen10 Plus V2', 'SGHD2HGZKC', 800),
      d('5U', 'Router', 'CISCO C921-4P', 'PSZ26501VGS', 15),
      d('3U', 'Router', 'C8200L-1N-4T', 'SFVT2923L1RQ', 60, 'NEW'),
      d('2U', 'Router', 'C8200L-1N-4T', 'SFVT2925L7U7', 60, 'NEW'),
      d('1U', 'Rack ATS', 'Eaton ATS 16A N', 'GA04P22145', 0),
    ],
  },
  {
    rack: 'RACK-14', label: 'ISV', siteId: 'finspot-isv-shared', clientId: 'finspot-isv',
    devices: [
      d('45', '', 'Cisco Catalyst 8200L', 'FVT2922L1VU', 60),
      d('44', '', 'Cisco Catalyst 8200L', 'FVT2922L1YQ', 60),
      d('43', '', 'Fortigate 100F', 'FG120GTK25039067', 29),
      d('42', '', 'Fortigate 100F', 'FG120GTK25040406', 29),
      d('41', '', 'Huawei S6720S-26Q-EI-24S-AC(24 Port)', '2102350MTRDMLA000008', 126),
      d('40', '', 'Huawei S6720S-26Q-EI-24S-AC(24 Port)', '2102350MTRDMLA000043', 126),
      d('39', '', 'Cisco WS-C2960S-24TS-S', 'FOC1708X51M', 36),
      d('38', '', 'Huawei S5720-52X-LI-AC(48 Port)', '21980106062SKC606640', 50),
      d('37', '', 'Huawei S5720 52x(48 Port)', '21980106062SKC606015', 50),
      d('36&35', '', 'HP DL 385 G10', 'SGH842T13R', 500),
      d('34&33', '', 'HP DL 385 G10', 'SGH842T13L', 500),
      d('32', '', 'Dell R630', '5S3QG62', 500),
      d('31', '', 'HP DL360 G10 Plus', 'CNXD0X01YD', 800),
      d('30', '', 'HP DL360 G10 Plus', 'CNXD0X01YY', 800),
      d('29&28', '', 'HP DL385 G10 Plus V2', 'SGHD2LMC5X', 800),
      d('27&26', '', 'HP DL 385 G10', 'SGH111V3T4', 500),
      d('25&24', '', 'HP DL385 G10 Plus V2', 'SGH505KKPC', 800),
      d('23', '', 'CISCO C921-4P', 'PSZ26521HAT', 40),
      d('22', '', 'CISCO C921-4P', 'PSZ2651224N', 40),
      d('21', '', 'cisco', 'FVT2932L1RC', 50),
      d('20', '', 'cisco ISR1100', 'FVT2918L4LB', 20),
      d('19', '', 'Cisco C1121-4P', 'FGL2748LHKN', 60),
      d('18', '', 'Cisco C1121-4P', 'FJC282011K0', 60),
      d('16', '', 'Cisco C1121-4P', 'FVT2912L4CH', 60),
      d('14', '', 'Cisco 4321', 'FDO2438M1CY', 60),
      d('13', '', 'Cisco Catalyst 8200L', 'SFVT2847L6BS', 60),
      d('12', '', 'Cisco Catalyst 8200L', 'SFVT2847L6GU', 60),
      d('11', '', 'Cisco Catalyst 8200L', 'SFJC28361D27', 60),
      d('10', '', 'Cisco C1121-4P', 'FVT2847L6DG', 60),
      d('9', '', 'Cisco 4321', 'FDO2230A5ZM', 60),
      d('8', '', 'Cisco C1121-4P', 'FJC28241PX4', 40),
      d('7', '', 'CISCO C921-4P', 'PSZ27141VXF', 25),
      d('6', '', 'CISCO C921-4P', 'PSZ26501YMQ', 25),
      d('5', '', 'Cisco 4321', 'FDO2438M1AU', 60),
      d('4&3', '', 'Cisco 1941', 'FGL214195KA', 35),
    ],
  },
  {
    rack: 'RACK-15', label: 'FS-DX', siteId: 'dx-prod', clientId: 'dx',
    devices: [
      d('45', 'NSE-Router', 'Cisco 4321', 'D553587', 90),
      d('44', 'NSE-Router', 'Cisco 4321', 'D557325', 90),
      d('43', 'BSE-Router', 'CISCO C921-4P', 'PSZ27141VXF', 25),
      d('42', 'BSE-Router', 'CISCO C921-4P', 'PSZ26501YMQ', 25),
      d('41', 'GW-Switch', 'S5735-L24-T4X-A', '4EKC000943', 43),
      d('40', 'GW-Switch', 'S5735-L24-T4X-A', '4EKC000205', 43),
      d('39', 'Firewall', 'Fortigate 100F', 'FG100FTK22025214', 26),
      d('38', 'Firewall', 'Fortigate 100F', 'FG100FTK22024167', 26),
      d('37', 'LAN-Switch', 'S6720S-26Q-EI-24S', '2102350MTRDML5000021', 170),
      d('36', 'LAN-Switch', 'S6720S-26Q-EI-24S', '2102350MTRDML6000047', 170),
      d('35', 'P2P-SW1', 'Huawei S5720-52X-LI-AC', '21980106062SKC605994', 50),
      d('34', 'P2P-SW2', 'Huawei S5720-52X-LI-AC', '21980106062SKC606634', 50),
      d('33', 'MGMT-Switch', 'Cisco SG350X-24-K9', 'DNI251500CV', 36),
      d('31-32', 'KVM1', 'HP DL 385 G10', 'SGH842T11R', 500),
      d('29-30', 'KVM2', 'HP DL 385 G10', 'SGH842T13Q', 500),
      d('27-28', 'ADP1', 'HP DL 385 G10', 'SGH842T13T', 500),
      d('25-26', 'ADP2', 'HP DL 385 G10', 'SGH842T3VC', 500),
      d('23-24', 'Server', 'FortiPAM 1000G', 'FPA1KGT625900016', 285),
      d('22', 'MPLS1', 'FALCON-R-801-SER', 'FC80004224', 20),
      d('21', 'MPLS2', 'FALCON-R-801-SER', 'FC80004225', 20),
      d('19-20', 'ISV-KVM6', 'HP DL 385 G10 Plus V2', 'SGHD2LMC6X', 800),
      d('18', 'Router', 'Cisco 4321', 'FDO2638M0P4', 90),
      d('17', 'Router', 'Cisco 4321', 'FDO2250A0D3', 90, 'New'),
      d('16', 'Router', 'Cisco C1121-4P', 'FVT2933L0W0', 66),
      d('15', 'Router', 'Cisco 8200', 'SFVT2847L5XB', 90),
      d('14', 'Router', 'Cisco 4321', 'SFDO2723M0K1', 90),
      d('13', 'Router', 'Cisco 1921', 'FGL212493YT', 90),
      d('7-8 U', 'Server(KVM6)', 'HP DL385 Gen11', 'CNXD2F009R', 1000),
      d('1&2&3U', 'Storage-Server', 'DELL 730XD', '1239S62', 750),
    ],
  },
  {
    rack: 'RACK-16', label: 'UAT', siteId: 'finspot-uat', clientId: 'finspot',
    devices: [
      d('44&45U', '', '60F', 'FGT60FTK2109C3RH', null, 'Remove'),
      d('44&45U', '', '70F', 'FGT70FTK22003592', 12, 'New'),
      d('42 &43&44U', '', 'Huawei S5720-52X-LI-AC', '2190106062SKC7600376', 85),
      d('40&41 U', '', 'Huawei 5720 32x(24 Port)', '2102359586DMJ7000295', 60),
      d('39 U', '', 'HP DL 385 G10', 'SGH842T13M', 500),
      d('37&38 U', '', 'dell R630', '669KG62', null, 'Remove'),
      d('34 & 35 U', '', 'Cisco 4221', 'FGL233930HJ', 90),
      d('32 U', '', 'Cisco router 900 series', 'PSZ26521NTS', 100),
      d('36 U', '', 'Dell R630', '5T1PG62', null, 'Remove'),
      d('34U', '', 'HP DL 385 G10', 'SGH842T13S', 500),
      d('33U', '', 'Dell R630', 'GKZQFD2', null, 'Remove'),
    ],
  },
  {
    rack: 'RACK-17', label: 'NEO', siteId: 'neo-wealth-prod', clientId: 'neo-wealth',
    devices: [
      d('45U', 'GW-Switch', 'Cisco C9200L-24T-4G', 'FVH275024G6', 125),
      d('44U', 'GW-Switch', 'Cisco C9200L-24T-4G', 'FVH27502491', 125),
      d('43U', 'Firewall', 'Fortigate 100F', 'FG100FTK23080679', 30),
      d('42U', 'Firewall', 'Fortigate 100F', 'FG100FTK23079224', 30),
      d('41U', 'MGMT-Switch', 'Cisco C9200L-24T-4G', 'FVH2750255Z', 125),
      d('40U', 'LAN-Switch', 'Cisco C9200L-24T-4G', 'FVH275024K4', 125),
      d('39U', 'LAN-Switch', 'Cisco C9200L-24T-4G', 'FVH275024C2', 125),
      d('38U', 'Agg-Server', 'HP DL360 Gen10 Plus', 'CNX30204VQ', 800),
      d('36U', 'Agg-Server', 'HP DL360 Gen10 Plus', 'CNX33500R4', 800),
      d('34U', 'Core-Server', 'HP DL360 Gen10 Plus', 'CNX301009M', 800),
      d('32U', 'Core-Server', 'HP DL360 Gen10 Plus', 'CNX301009Q', 800),
      d('31U-30U', 'KVM1', 'HP DL385 Gen10 Plus V2', 'SGHD2LMC5D', 800, 'NEW'),
      d('29U', 'LE-Server', 'HP DL360 Gen10 Plus', 'CNX30204VS', 800),
      d('8U', 'MCX-TCL', 'Cisco C8200L-1N-4T', 'FVT2942L3FV', 100),
      d('7U', 'MCX-Airtel', 'Cisco C8200L-1N-4T', 'FVT2942L3FU', 100),
      d('6U', 'NSE-Router-TCL', 'Cisco C8200L-1N-4T', 'SFGL2809LHAL', 100),
      d('5U', 'NSE-Router-Airtel', 'Cisco C8200L-1N-4T', 'SFGL2809LHG2', 100),
      d('4U', 'BSE-Router-TCL', 'CISCO C1121-4P', 'FJC28201137', 19),
      d('2U-3U', 'BSE-Router-Airtel', 'CISCO C921-4P', 'PSZ26521N24', 25),
      d('1U', 'Rack ATS', 'Eaton ATS 16 N', 'GA04R12205', 0),
    ],
  },
  {
    rack: 'RACK-19', label: 'LEMONN-MUM', siteId: 'lemonn-prod', clientId: 'lemonn',
    devices: [
      d('45U', 'Firewall', 'Fortigate 120G', 'FG120GTK25008423', 40),
      d('44U', 'Firewall', 'Fortigate 120G', 'FG120GTK25009067', 40),
      d('43U', 'MGMT-Switch', 'Cisco C1300-48T-4G', 'PVN29151SMH', 33),
      d('42U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L6FR', 750),
      d('41U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L6MQ', 750),
      d('40-39U', 'Server(KVM1)', 'HP DL385 Gen10 Plus V2', 'SGHD2HGZJQ', 800),
      d('38-37U', 'Server(KVM2)', 'HP DL385 Gen10 Plus V2', 'SGHD2TFSB8', 800),
      d('36-35U', 'Server(Techexcel-Web)', 'HP DL380 Gen10 Plus', 'CNXD2J001V', 800),
      d('34-33U', 'Server(Techexcel-Main)', 'HP DL380 Gen10 Plus', 'CNXD2J001Q', 800),
      d('32-31U', 'Server(Techexcel-HO)', 'HP DL380 Gen10 Plus', 'CNXD2J001R', 800),
      d('30-29U', 'Server(Tracker1)', 'HP DL380 Gen10 Plus', 'CNXD2J001P', 800),
      d('7U', 'Router', 'CISCO C921-4P', 'PSZ26521LCJ', 25, 'NEW'),
      d('5U', 'Router', 'CISCO C921-4P', 'PSZ26521HU5', 25),
      d('3U', 'Router', 'Cisco Catalyst 8200L', 'FVT2847L5X8', 60),
      d('2U', 'Router', 'Cisco Catalyst 8200L', 'FVT2847L6YM', 60),
      d('1U', 'Rack ATS', 'Eaton ATS 16 N', 'GA04P22172', 0),
      d('1-2U', 'Horizonal PDU', 'Horizontal PDU', '', 0),
    ],
  },
  {
    rack: 'RACK-20', label: 'SMIFs', siteId: 'smifs-prod', clientId: 'smifs',
    devices: [
      d('45U', 'Firewall', 'Fortigate 120G', 'FG120GTK25028624', 40),
      d('44U', 'Firewall', 'Fortigate 120G', 'FG120GTK25029249', 40),
      d('43U', 'MGMT-Switch', 'Cisco C1300-48T-4G', 'PVN29151TAT', 33),
      d('42U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L65F', 750),
      d('41U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2930L6FN', 750),
      d('40-39U', 'Server(KVM1)', 'HP DL385 Gen10 Plus V2', 'SGHD2LMC63', 800),
      d('38-37U', 'Server(KVM2)', 'HP DL385 Gen10 Plus V2', 'SGHD2LMC75', 800),
      d('36-35U', 'Server(Storage)', 'HP DL385 Gen10 Plus V2', 'SGH419GQDR', 800),
      d('16U', 'Router', 'CISCO C921-4P', 'PSZ27141BK4', 25, 'NEW'),
      d('14-15U', 'Router-NCDX', 'CISCO C1121X-8P', 'SFVT3003L2ZF', 25),
      d('13U', 'Router-MSE', 'CISCO C1121-4P', 'FVT2948L3NP', 25),
      d('11U', 'Router-MCX', 'Cisco C8200L-1N-4T', 'FGL2524LF6G', 100),
      d('10U', 'Router-MCX', 'Cisco C8200-1N-4T', 'SFVT2931L51X', 100),
      d('9U', 'Router-BSE', 'CISCO C921-4P', 'PSZ265125RS', 15),
      d('8U', 'Router-BSE', 'CISCO C921-4P', 'PSZ26511MA6', 15),
      d('7U', 'Router-NSE', 'Cisco C8200L-1N-4T', 'SFVT2925L811', 100),
      d('6U', 'Router-NSE', 'Cisco C8200L-1N-4T', 'SFVT2925L7P3', 100),
      d('5U', 'Rack ATS1', 'Eaton ATS 16A N', 'GA04T42003', 0),
      d('4U', 'Rack ATS2', 'Eaton ATS 16A N', 'GA04T42004', 0),
      d('2U', 'PDU', 'PDU'),
      d('1U', 'PDU', 'PDU'),
    ],
  },
  {
    rack: 'RACK-23', label: 'MOBIKWIK', siteId: 'mobikwik-prod', clientId: 'mobikwik',
    devices: [
      d('45U', 'Firewall', 'Fortigate 120G', 'FG120GTK25004163', 40),
      d('44U', 'Firewall', 'Fortigate 120G', 'FG120GTK25040234', 40),
      d('43U', 'MGMT-Switch', 'Cisco C1300-48T-4G', 'PVN29151TBV', 33),
      d('42U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2947LB4N', 750),
      d('41U', 'LAN-Switch', 'Cisco C9300X-48TX-A', 'FVH2947LBBD', 750),
      d('40-39U', 'Server(KVM1)', 'HP DL385 Gen10 Plus V2', 'SGHD2LMC7M', 800),
      d('38-37U', 'Server(KVM2)', 'HP DL385 Gen10 Plus V2', 'SGHD2HGZHR', 800),
      d('36-35U', 'Server(Techexcel-DB1)', 'HP DL380 Gen10 Plus', 'CNX30203GP', 800),
      d('34-33U', 'Server(Techexcel-DB2)', 'HP DL380 Gen10 Plus', 'CNXD2J001T', 800),
      d('32-31U', 'Server(Techexcel-App1)', 'HP DL380 Gen10 Plus', 'CNXD2J001S', 800),
      d('30-29U', 'Server(Techexcel-App2)', 'HP DL380 Gen10 Plus', 'CNXD1C01M8', 800),
      d('8U', 'Router-BSE', 'CISCO C921-4P', 'PSZ27141BK4', 25),
      d('7U', 'Router-BSE', 'CISCO C921-4P'),
      d('6U', 'Router-NSE', 'Cisco C8200L-1N-4T'),
      d('5U', 'Router-NSE', 'Cisco C8200L-1N-4T'),
      d('4U', 'Rack ATS2', 'Eaton ATS 16A N', 'GA04V12314', null, 'NEW'),
      d('2U', 'PDU', 'PDU'),
      d('1U', 'PDU', 'PDU'),
    ],
  },
  {
    rack: 'RACK-32', label: 'DX-DR', siteId: 'dx-prod', clientId: 'dx',
    devices: [
      d('42U', '', 'Cisco C9300X-48TX-A', 'FVH2930L64W', 350, 'New', { maxPower: 750, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Common' }),
      d('41U', '', 'Cisco C9300X-48TX-A', 'FVH2930L66G', 350, 'New', { maxPower: 750, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Common' }),
      d('40U', '', 'Fortigate 100F', 'FG100FTK23004984', 30, '', { maxPower: 30, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Common' }),
      d('39U', '', 'Fortigate 100F', 'FG100FTK23038962', 30, '', { maxPower: 30, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Common' }),
      d('38U', '', 'Cisco N9K-C9372TX', 'SAL1949U8SN', 32, '', { maxPower: 650, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Way2Wealth' }),
      d('37U', '', 'Cisco N9K-C9372TX', 'FDO20280P8E', 32, '', { maxPower: 650, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Way2Wealth' }),
      d('36 & 35U', '', 'Dell Power edge R740xd', '2Q5ZB53', 750, '', { maxPower: 750, powerSources: 2, belongsTo: 'Way2Wealth', assignedTo: 'Way2Wealth' }),
      d('34 & 33U', '', 'Dell Power edge R740xd', 'G4JR3W2', 750, '', { maxPower: 750, powerSources: 2, belongsTo: 'Way2Wealth', assignedTo: 'Way2Wealth' }),
      d('31 & 30U', '', 'Dell Power edge R740xd', 'G4JQ3W2', 750, '', { maxPower: 750, powerSources: 2, belongsTo: 'Way2Wealth', assignedTo: 'Way2Wealth' }),
      d('29U', '', 'Huawei S572032x(24 Port)', 'FGT60FTK2109C3RH', 50, '', { maxPower: 60, powerSources: 1, belongsTo: 'Finspot', assignedTo: 'Common' }),
      d('26 & 25U', '', 'HP DL385 Gen10', 'SGH842T13K', 500, '', { maxPower: 500, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'VM rental Purpose' }),
      d('24 & 23U', '', 'HP DL385 Gen10', '', 800, '', { maxPower: 800, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Finspot' }),
      d('22U', '', 'HP DL360 Gen10 Plus', '', 800, '', { maxPower: 800, powerSources: 2, belongsTo: 'Finspot', assignedTo: 'Finspot' }),
      d('7U', '', 'Falcon-R-801-ser', 'FC80004137', 10, '', { maxPower: 20, powerSources: 1, belongsTo: 'Finspot', assignedTo: 'Finspot-MPLS-TTML' }),
      d('6U', '', 'cisco C8200L-1N-4T', 'SFGL2809LHKM', 100, '', { maxPower: 150, powerSources: 1, belongsTo: 'NSE-TCL', assignedTo: 'Finspot' }),
      d('5U', '', 'cisco C8200L-1N-4T', 'SFGL2809LHGH', 100, '', { maxPower: 150, powerSources: 1, belongsTo: 'NSE-Airtel', assignedTo: 'Finspot' }),
      d('4U & 3U', '', 'CISCO C1121-4P', 'FGL2748LHRJ', 19, '', { maxPower: 19, powerSources: 1, belongsTo: 'BSE-TCL', assignedTo: 'Finspot' }),
      d('2U & 1U', '', 'CISCO C1121-4P', 'FGL2748LHRL', 19, '', { maxPower: 19, powerSources: 1, belongsTo: 'BSE-Airtel', assignedTo: 'Finspot' }),
    ],
  },
];

function slug(value) {
  return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sql(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  return `ARRAY[${values.map(sql).join(',')}]::text[]`;
}

function vendor(model) {
  const m = String(model || '').toLowerCase();
  if (m.includes('fortigate') || m.includes('fortipam') || /^fgt/.test(m)) return 'Fortinet';
  if (m.includes('cisco') || m.includes('catalyst') || m.includes('n9k') || m.includes('c1121') || m.includes('c921') || m.includes('c8200') || m.includes('isr') || /\b4321\b/.test(m) || /\b4221\b/.test(m) || /\b1941\b/.test(m) || /\b1921\b/.test(m)) return 'Cisco';
  if (m.includes('huawei') || m.includes('s5720') || m.includes('s5735') || m.includes('s6720')) return 'Huawei';
  if (m.includes('hp ') || m.includes('dl360') || m.includes('dl380') || m.includes('dl385')) return 'HP';
  if (m.includes('dell') || m.includes('power edge') || m.includes('poweredge') || m.includes('r630') || m.includes('r740') || m.includes('730xd')) return 'Dell';
  if (m.includes('eaton')) return 'Eaton';
  if (m.includes('falcon')) return 'Falcon';
  return 'Unknown';
}

function deviceType(type, model) {
  const value = `${type} ${model}`.toLowerCase();
  if (value.includes('firewall') || value.includes('fortigate')) return 'Firewall';
  if (value.includes('router') || value.includes('c921') || value.includes('c8200') || value.includes('c1121') || /\b4321\b/.test(value) || /\b4221\b/.test(value) || /\b1941\b/.test(value) || /\b1921\b/.test(value)) return 'Router';
  if (value.includes('switch') || value.includes('-sw') || value.includes('c9300') || value.includes('c9200') || value.includes('s5720') || value.includes('s5735') || value.includes('s6720') || value.includes('n9k') || value.includes('c1300') || value.includes('sg350')) return 'Switch';
  if (value.includes('storage') || value.includes('730xd')) return 'Storage';
  if (value.includes('ats') || value.includes('pdu') || value.includes('power')) return 'Power';
  if (value.includes('server') || value.includes('kvm') || value.includes('adp') || value.includes('dl360') || value.includes('dl380') || value.includes('dl385') || value.includes('r630') || value.includes('r740')) return 'Server';
  return 'Device';
}

function maxU(devices) {
  const nums = devices.flatMap((device) => String(device.u || '').match(/\d+/g) || []).map(Number);
  return nums.length ? Math.max(...nums) : 45;
}

function status(device) {
  return /remove/i.test(`${device.remarks} ${device.power}`) ? 'Offline' : 'Active';
}

function deviceName(device) {
  const cleanType = String(device.type || '').trim();
  const cleanModel = String(device.model || 'Unknown').trim();
  return cleanType ? `${cleanType} (${cleanModel})` : cleanModel;
}

function deviceId(rack, device, index) {
  return `${rack.siteId}-${slug(rack.rack)}-${slug(device.u)}-${slug(device.serial || device.model || index)}`;
}

function config(rack, device) {
  return JSON.stringify({
    source: SOURCE,
    rack: rack.rack,
    rackLabel: rack.label,
    uSpace: device.u,
    powerWatts: device.power,
    maximumPowerWatts: device.maxPower ?? null,
    powerSources: device.powerSources ?? null,
    remarks: device.remarks || null,
  });
}

const flatDevices = racks.flatMap((rack) => rack.devices.map((device, index) => ({ rack, device, index })));

if (process.argv.includes('--summary')) {
  console.log(`racks=${racks.length}`);
  console.log(`devices=${flatDevices.length}`);
  for (const rack of racks) console.log(`${rack.rack}\t${rack.label}\t${rack.siteId}\t${rack.devices.length}`);
  process.exit(0);
}

console.log('BEGIN;');
console.log(`-- ${SOURCE}`);
console.log(`
INSERT INTO clients (id, name, slug, status)
VALUES ('mobikwik', 'MOBIKWIK', 'mobikwik', 'Active')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, status=EXCLUDED.status;

INSERT INTO sites (id, name, env, region, status, notes)
VALUES ('mobikwik-prod', 'MOBIKWIK (PROD)', 'PROD', 'Mumbai', 'Active', 'Created from rack inventory import')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, env=EXCLUDED.env, region=EXCLUDED.region, status=EXCLUDED.status;

INSERT INTO site_clients (site_id, client_id)
VALUES ('mobikwik-prod', 'mobikwik')
ON CONFLICT DO NOTHING;
`);

for (const rack of racks) {
  const rackId = `rack-${slug(rack.siteId)}-${slug(rack.rack)}`;
  console.log(`
INSERT INTO racks (id, site_id, name, total_u, notes)
VALUES (${sql(rackId)}, ${sql(rack.siteId)}, ${sql(rack.rack)}, ${maxU(rack.devices)}, ${sql(`Imported from ${rack.label}; ${SOURCE}`)})
ON CONFLICT (id) DO UPDATE SET
  site_id=EXCLUDED.site_id,
  name=EXCLUDED.name,
  total_u=EXCLUDED.total_u,
  notes=EXCLUDED.notes;`);

  rack.devices.forEach((device, index) => {
    const id = deviceId(rack, device, index);
    const type = deviceType(device.type, device.model);
    const maker = vendor(device.model);
    const currentStatus = status(device);
    const owner = device.belongsTo || null;
    const tags = [
      `rack:${rack.rack}`,
      `rack_label:${rack.label}`,
      `u_space:${device.u}`,
      device.power !== null && device.power !== undefined ? `power_watts:${device.power}` : null,
      device.maxPower !== undefined ? `max_power_watts:${device.maxPower}` : null,
      device.remarks ? `remarks:${device.remarks}` : null,
    ].filter(Boolean);

    console.log(`
INSERT INTO infrastructure
  (id, name, vendor, model, type, status, site_id, rack_id, u_position, serial, owner, assigned_to, config)
VALUES
  (${sql(id)}, ${sql(deviceName(device))}, ${sql(maker)}, ${sql(device.model || 'Unknown')}, ${sql(type)}, ${sql(currentStatus)}, ${sql(rack.siteId)}, ${sql(rackId)}, ${sql(device.u)}, ${sql(device.serial)}, ${sql(owner)}, ${sql(device.assignedTo || null)}, ${sql(config(rack, device))})
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  vendor=EXCLUDED.vendor,
  model=EXCLUDED.model,
  type=EXCLUDED.type,
  status=EXCLUDED.status,
  site_id=EXCLUDED.site_id,
  rack_id=EXCLUDED.rack_id,
  u_position=EXCLUDED.u_position,
  serial=EXCLUDED.serial,
  owner=EXCLUDED.owner,
  assigned_to=EXCLUDED.assigned_to,
  config=EXCLUDED.config;

INSERT INTO assets
  (id, name, type, manufacturer, model, status, serial, tags, owner, site_id, client_id)
VALUES
  (${sql(id)}, ${sql(deviceName(device))}, ${sql(type)}, ${sql(maker)}, ${sql(device.model || 'Unknown')}, ${sql(currentStatus)}, ${sql(device.serial)}, ${sqlArray(tags)}, ${sql(owner)}, ${sql(rack.siteId)}, ${sql(rack.clientId)})
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  type=EXCLUDED.type,
  manufacturer=EXCLUDED.manufacturer,
  model=EXCLUDED.model,
  status=EXCLUDED.status,
  serial=EXCLUDED.serial,
  tags=EXCLUDED.tags,
  owner=EXCLUDED.owner,
  site_id=EXCLUDED.site_id,
  client_id=EXCLUDED.client_id;`);
  });
}

console.log('COMMIT;');
