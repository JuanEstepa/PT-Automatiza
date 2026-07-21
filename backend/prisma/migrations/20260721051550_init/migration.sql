-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "isoCode" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" SERIAL NOT NULL,
    "countryId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "patronValidacion" TEXT,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "codigoEmpleado" TEXT NOT NULL,
    "primerNombre" TEXT NOT NULL,
    "segundoNombre" TEXT,
    "primerApellido" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "countryId" INTEGER NOT NULL,
    "area" TEXT,
    "cargo" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "fechaRetiro" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "jornada" TEXT,
    "biostarUserId" TEXT,
    "tarjetaRfid" TEXT,
    "nivelAcceso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "numeroOriginal" TEXT NOT NULL,
    "numeroNormalizado" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "codigoSede" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "direccion" TEXT,
    "aforoMaximo" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSite" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "esSedePrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmployeeSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "biostarDeviceId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessEvent" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "siteId" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "direccion" TEXT NOT NULL,
    "ocurridoEn" TIMESTAMP(3) NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'BIOSTAR_SIM',

    CONSTRAINT "AccessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionBatch" (
    "id" SERIAL NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "ejecutadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalFilas" INTEGER NOT NULL,
    "filasOk" INTEGER NOT NULL,
    "filasRechazadas" INTEGER NOT NULL,

    CONSTRAINT "IngestionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRowResult" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "numeroFila" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "motivo" TEXT,
    "employeeId" INTEGER,

    CONSTRAINT "IngestionRowResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode_key" ON "Country"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_countryId_codigo_key" ON "DocumentType"("countryId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_codigoEmpleado_key" ON "Employee"("codigoEmpleado");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDocument_documentTypeId_numeroNormalizado_key" ON "EmployeeDocument"("documentTypeId", "numeroNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Site_codigoSede_key" ON "Site"("codigoSede");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSite_employeeId_siteId_key" ON "EmployeeSite"("employeeId", "siteId");

-- CreateIndex
CREATE INDEX "AccessEvent_siteId_ocurridoEn_idx" ON "AccessEvent"("siteId", "ocurridoEn");

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSite" ADD CONSTRAINT "EmployeeSite_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSite" ADD CONSTRAINT "EmployeeSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRowResult" ADD CONSTRAINT "IngestionRowResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IngestionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRowResult" ADD CONSTRAINT "IngestionRowResult_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
