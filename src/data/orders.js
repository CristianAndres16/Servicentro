export const initialOrders = [
  {
    id: 1,
    placa: "BFX-228",
    cliente: "Marcela",
    telefono: "3116052556",
    fechaIngreso: "2026-10-22",
    mecanico: "Carlos Gómez",
    serviciosServiteca: {
      lavadaSencilla: true,
      brillada: false,
      alineacion: true,
      balanceo: true,
      cambioAceite: false,
    },
    itemsTaller: [
      { idItem: 101, descripcion: "Mano de obra taller", cantidad: 1, precio: 320000 },
      { idItem: 102, descripcion: "Líquido de frenos", cantidad: 2, precio: 25000 }
    ],
    estadoMecanico: "Listo para Cierre",
    estadoFacturacion: "Pendiente de Cobro"
  },
  {
    id: 2,
    placa: "IYO-068",
    cliente: "José Guillen",
    telefono: "3217592414",
    fechaIngreso: "2026-10-20",
    mecanico: "Alberto 'El Pro' Ruiz",
    serviciosServiteca: {
      lavadaSencilla: false,
      brillada: false,
      alineacion: false,
      balanceo: false,
      cambioAceite: true,
    },
    itemsTaller: [
      { idItem: 201, descripcion: "Mano de obra taller", cantidad: 1, precio: 450000 },
      { idItem: 202, descripcion: "Aceite Primax", cantidad: 6, precio: 57000 },
      { idItem: 203, descripcion: "Pastas de freno", cantidad: 1, precio: 231000 }
    ],
    estadoMecanico: "En Taller",
    estadoFacturacion: "Pendiente de Cobro"
  }
];
