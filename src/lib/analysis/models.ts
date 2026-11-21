/** Immutable model revisions keep deployments reproducible. Bump only after fixture evaluation. */
export const SPEECH_MODEL = {
  id: "onnx-community/whisper-base",
  revision: "27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c",
};
export const SPEECH_METADATA_FILES = [
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "preprocessor_config.json",
  "generation_config.json",
] as const;
export const SOUND_MODEL = {
  id: "Xenova/ast-finetuned-audioset-10-10-0.4593",
  revision: "249a1fbf0286b40e7f1ed687a8ae396997bf7dc6",
};
export const SOUND_METADATA_FILES = [
  "config.json",
  "preprocessor_config.json",
] as const;
export const MODEL_METADATA_ASSETS = [
  ...SPEECH_METADATA_FILES.map((file) => ({
    remote: `https://huggingface.co/${SPEECH_MODEL.id}/resolve/${SPEECH_MODEL.revision}/${file}`,
    local: `/models/whisper-base/${SPEECH_MODEL.revision}/${file}`,
  })),
  ...SOUND_METADATA_FILES.map((file) => ({
    remote: `https://huggingface.co/${SOUND_MODEL.id}/resolve/${SOUND_MODEL.revision}/${file}`,
    local: `/models/audioset/${SOUND_MODEL.revision}/${file}`,
  })),
];
export const RANK_MODEL = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC";
export const RANK_REVISION = "a822ee410075710c9673005eafa017b90136b85d";
export const RANK_MODEL_URL = `https://huggingface.co/mlc-ai/${RANK_MODEL}/resolve/${RANK_REVISION}/`;
export const RANK_LIBRARY_URL =
  "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_87/base/Qwen2-1.5B-Instruct-q4f32_1_cs1k-webgpu.wasm";
