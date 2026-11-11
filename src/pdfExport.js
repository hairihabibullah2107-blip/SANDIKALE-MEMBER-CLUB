export async function captureElementCanvas(element, options = {}) {
  if (!element) throw new Error("Elemen dokumen tidak ditemukan.");
  const {
    scale = 2,
    wrapperClass = "",
    widthMm = null,
    qrValue = null
  } = options;

  const [{ default: html2canvas }, { default: QRCode }] = await Promise.all([import("html2canvas"), import("qrcode")]);
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true);
  if (clone.matches?.("[data-pdf-ignore]")) clone.remove();
  clone.querySelectorAll?.("[data-pdf-ignore]").forEach(node => node.remove());

  if (qrValue) {
    const qrImage = clone.querySelector("img");
    if (qrImage) qrImage.src = await QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 480,
      color: { dark: "#111111", light: "#FFFFFF" }
    });
  }

  const qrImages = Array.from(clone.querySelectorAll?.("img[data-qr-value]") || []);
  for (const image of qrImages) {
    image.src = await QRCode.toDataURL(image.dataset.qrValue, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 480,
      color: { dark: "#111111", light: "#FFFFFF" }
    });
    image.removeAttribute("crossorigin");
  }

  const wrapper = document.createElement("div");
  wrapper.className = wrapperClass;
  Object.assign(wrapper.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    display: "block",
    width: widthMm ? widthMm + "mm" : Math.max(1, rect.width) + "px",
    minWidth: widthMm ? widthMm + "mm" : Math.max(1, rect.width) + "px",
    maxWidth: "none",
    height: "auto",
    margin: "0",
    padding: "0",
    background: "#ffffff",
    overflow: "visible",
    zIndex: "-1",
    pointerEvents: "none"
  });
  clone.style.maxWidth = "none";
  if (widthMm) clone.style.width = "100%";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await document.fonts?.ready;
    await Promise.all(Array.from(wrapper.querySelectorAll("img")).map(image => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Gambar dokumen gagal dimuat."));
      });
    }));
    return await html2canvas(wrapper, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: Math.max(wrapper.scrollWidth, 1),
      windowHeight: Math.max(wrapper.scrollHeight, 1)
    });
  } finally {
    wrapper.remove();
  }
}

export async function downloadElementPdf(element, filename, options = {}) {
  const { widthMm = null, marginMm = 10, orientation = "portrait" } = options;
  const [{ jsPDF }] = await Promise.all([import("jspdf")]);
  const canvas = await captureElementCanvas(element, options);
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = widthMm || pageWidth - marginMm * 2;
  const imageX = widthMm ? (pageWidth - imageWidth) / 2 : marginMm;
  const maxImageHeight = pageHeight - marginMm * 2;
  const sourcePageHeight = Math.max(1, Math.floor(maxImageHeight * canvas.width / imageWidth));
  let sourceY = 0;
  let page = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(sourcePageHeight, canvas.height - sourceY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext("2d");
    if (!context) throw new Error("Canvas PDF tidak dapat dibuat.");
    context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    const imageHeight = sliceHeight * imageWidth / canvas.width;
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", imageX, marginMm, imageWidth, imageHeight, undefined, "FAST");
    sourceY += sliceHeight;
    page += 1;
  }

  pdf.save(filename);
}
