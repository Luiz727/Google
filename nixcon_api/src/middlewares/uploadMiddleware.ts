import multer from 'multer';
import path from 'path';

// Usar memoryStorage para manter o arquivo em buffer antes de enviar para o Supabase Storage.
// Para arquivos muito grandes, diskStorage ou streaming direto podem ser mais apropriados.
const storage = multer.memoryStorage();

// Filtro de arquivo opcional (exemplo: permitir apenas certos tipos de arquivo)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Exemplo: Aceitar apenas imagens JPEG e PNG
  // const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  // if (allowedMimes.includes(file.mimetype)) {
  //   cb(null, true);
  // } else {
  //   cb(new Error('Tipo de arquivo inválido. Apenas JPEG, PNG, PDF são permitidos.'), false);
  // }
  // Por agora, aceitar todos os arquivos para flexibilidade inicial.
  cb(null, true);
};

// Configuração do Multer
const upload = multer({
  storage: storage,
  // limits: {
  //   fileSize: 1024 * 1024 * 5, // Limite de 5MB (exemplo)
  // },
  fileFilter: fileFilter,
});

export default upload;
