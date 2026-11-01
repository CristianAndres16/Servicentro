export const initialOrders = [
  {
    id: 1,
    placa: "BFX-228",
    cliente: "Marcela",
    telefono: "3116052556",
    fechaIngreso: "2026-10-22",
    mecanico: "Carlos Gómez",
    itemsTaller: [
      { idItem: 101, descripcion: "Mano de obra taller", cantidad: 1, precio: 320000, tipo: "Servicio" },
      { idItem: 102, descripcion: "Líquido de frenos", cantidad: 2, precio: 25000, tipo: "Producto" },
      { idItem: 103, descripcion: "Lavado sencillo", cantidad: 1, precio: 25000, tipo: "Servicio" },
      { idItem: 104, descripcion: "Alineación", cantidad: 1, precio: 65000, tipo: "Servicio" },
      { idItem: 105, descripcion: "Balanceo", cantidad: 1, precio: 40000, tipo: "Servicio" }
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
    itemsTaller: [
      { idItem: 201, descripcion: "Mano de obra taller", cantidad: 1, precio: 450000, tipo: "Servicio" },
      { idItem: 202, descripcion: "Aceite Primax", cantidad: 6, precio: 57000, tipo: "Producto" },
      { idItem: 203, descripcion: "Pastas de freno", cantidad: 1, precio: 231000, tipo: "Producto" },
      { idItem: 204, descripcion: "Cambio de aceite", cantidad: 1, precio: 35000, tipo: "Servicio" }
    ],
    estadoMecanico: "En Taller",
    estadoFacturacion: "Pendiente de Cobro"
  }
];
