/** Explicit scene bindings to independently reviewed textbook crops.
 * Frozen textbook identities and audio are unchanged. Imported learning records
 * cannot provide figure IDs, paths or images. Every crop keeps its source hash.
 */
import {getSourceLesson,sourceFigureAssetPath,type SourceFigure,type SourceLesson} from './content.ts';
import type {OfficialViRegistry} from '../content/official-vi-revisions.ts';
const textbookSHA256='25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba';
export const sceneFigureBindings = {
  "textbook-l01-text-1": {
    "lesson": 1,
    "figures": [
      {
        "id": "l01-text-1-photo",
        "sha256": "e705735a2a9b68de21dd19964e29a17d279be14c940e78bbecbd760db992201d",
        "printedPage": 1
      }
    ]
  },
  "textbook-l01-text-2": {
    "lesson": 1,
    "figures": [
      {
        "id": "l01-text-2-photo",
        "sha256": "152465f33b7e5c3e03b2a07ffac965c1792638b801ba4b1e8944957801d5f80a",
        "printedPage": 2
      }
    ]
  },
  "textbook-l01-text-3": {
    "lesson": 1,
    "figures": [
      {
        "id": "l01-text-3-photo",
        "sha256": "9b8d10f97e622059562085d54f1a56c816d4845e5119a990de8eb515a1eddbe0",
        "printedPage": 3
      }
    ]
  },
  "textbook-l02-text-1": {
    "lesson": 2,
    "figures": [
      {
        "id": "l02-text-1-photo",
        "sha256": "2251fcbced21c375972f152cc110ec1ceff97ca056702225a1f9707f60eaf077",
        "printedPage": 5
      },
      {
        "id": "l02-text-1-portrait",
        "sha256": "497bde08934c7e77cd994b80a25099b2abfa6162d6a31abc59376b8f17111ad7",
        "printedPage": 6
      }
    ]
  },
  "textbook-l02-text-2": {
    "lesson": 2,
    "figures": [
      {
        "id": "l02-text-2-photo",
        "sha256": "de4a3659d51264b4880fa758865fbdfb53b12ecd942748434039289d1825c1af",
        "printedPage": 7
      }
    ]
  },
  "textbook-l02-text-3": {
    "lesson": 2,
    "figures": [
      {
        "id": "l02-text-3-photo",
        "sha256": "2324d70b9fe3f94ff24249a41e221d54e84ae7c6efd685c143de121cf2e2e41f",
        "printedPage": 8
      }
    ]
  },
  "textbook-l03-text-1": {
    "lesson": 3,
    "figures": [
      {
        "id": "l03-text-1-photo",
        "sha256": "be826c1f6dcdc97b2471a2aba719c85a153d7c31ecfc35567baac18f4bfccc77",
        "printedPage": 10
      }
    ]
  },
  "textbook-l03-text-2": {
    "lesson": 3,
    "figures": [
      {
        "id": "l03-text-2-photo",
        "sha256": "146184286fd558117129b7b203dd75f6df069ea1d8cae637329ddef53dd5f1d7",
        "printedPage": 12
      }
    ]
  },
  "textbook-l03-text-3": {
    "lesson": 3,
    "figures": [
      {
        "id": "l03-text-3-photo",
        "sha256": "c2332e8092da283f1d76c64b68549c838324766d9aab63e7e895361a7225dd3f",
        "printedPage": 13
      }
    ]
  },
  "textbook-l04-text-1": {
    "lesson": 4,
    "figures": [
      {
        "id": "l04-text1",
        "sha256": "9c71a8787389f5e5faee6d9336eb1b9481210549c75186df052eeff2d3cf4e0f",
        "printedPage": 19
      }
    ]
  },
  "textbook-l04-text-2": {
    "lesson": 4,
    "figures": [
      {
        "id": "l04-text2",
        "sha256": "4affdc8bde96102b1a8e9ce0f414d47bcfa94bdb693fc0c3058456f377045e02",
        "printedPage": 22
      }
    ]
  },
  "textbook-l04-text-3": {
    "lesson": 4,
    "figures": [
      {
        "id": "l04-text3",
        "sha256": "6a8c41c3af5e8019d0cd755b374f10f56a03afa6df677596496d7c0a5deec0df",
        "printedPage": 24
      }
    ]
  },
  "textbook-l05-text-1": {
    "lesson": 5,
    "figures": [
      {
        "id": "l05-scene-01",
        "sha256": "d36a7fbab69bfc65031d12362979ff204e9b414b102c500ae1dd08ac65d77255",
        "printedPage": 28
      }
    ]
  },
  "textbook-l05-text-2": {
    "lesson": 5,
    "figures": [
      {
        "id": "l05-scene-02",
        "sha256": "35dfa32f8f6ac10fdb7ca738214e16f228045c0dae336bfc8b0bf9aa32670ab3",
        "printedPage": 30
      }
    ]
  },
  "textbook-l05-text-3": {
    "lesson": 5,
    "figures": [
      {
        "id": "l05-scene-03",
        "sha256": "feafb071411861c45d5034f193ff0dc22861b42b53b282d611eb2064b1a6bb32",
        "printedPage": 32
      }
    ]
  },
  "textbook-l06-text-1": {
    "lesson": 6,
    "figures": [
      {
        "id": "l06-scene-01",
        "sha256": "80444973de0a496f46148116114aa1a9a6aef2a06998a4a3ffe2b245a481ddc5",
        "printedPage": 36
      }
    ]
  },
  "textbook-l06-text-2": {
    "lesson": 6,
    "figures": [
      {
        "id": "l06-scene-02",
        "sha256": "d0f2286fcf2e5c35a73d59bf8c5a691ac026443554792102fa38b7de614f94a8",
        "printedPage": 37
      }
    ]
  },
  "textbook-l06-text-3": {
    "lesson": 6,
    "figures": [
      {
        "id": "l06-scene-03",
        "sha256": "e27ecfdae066bad32ed10ad74a19d54ff5fe6bebdb25aca4ab873739acfb0abe",
        "printedPage": 39
      }
    ]
  },
  "textbook-l07-text-1": {
    "lesson": 7,
    "figures": [
      {
        "id": "l07-scene-01",
        "sha256": "9429551ce66bd06b8e4e0fd55509d5eff794fa176aadf1cb9c33ae07dd99fcfc",
        "printedPage": 46
      }
    ]
  },
  "textbook-l07-text-2": {
    "lesson": 7,
    "figures": [
      {
        "id": "l07-scene-02",
        "sha256": "a2e9171487ad74d0255043b2c0b3ef112207d520bef628dc5180937a2b6a6dcc",
        "printedPage": 48
      }
    ]
  },
  "textbook-l07-text-3": {
    "lesson": 7,
    "figures": [
      {
        "id": "l07-scene-03",
        "sha256": "31ceff1c53773087aaecdf137c7a07e71bf4edf76da175712b830015abc74874",
        "printedPage": 51
      }
    ]
  },
  "textbook-l08-text-1": {
    "lesson": 8,
    "figures": [
      {
        "id": "l08-scene-01",
        "sha256": "6b10588846f6262e564eeafdab9a38ddeea52c41ccb7946d16800a0498d407f0",
        "printedPage": 55
      }
    ]
  },
  "textbook-l08-text-2": {
    "lesson": 8,
    "figures": [
      {
        "id": "l08-scene-02",
        "sha256": "52c3b0a0a1b99fda08ba449fa00b17288025a7d31e29aab2061437d14a808e02",
        "printedPage": 56
      }
    ]
  },
  "textbook-l08-text-3": {
    "lesson": 8,
    "figures": [
      {
        "id": "l08-scene-03",
        "sha256": "efd8d3798aae78cb1e814ae1f6e5c42b9ee9c32556aa3c4de3c8850d0c14f07c",
        "printedPage": 58
      }
    ]
  },
  "textbook-l09-text-1": {
    "lesson": 9,
    "figures": [
      {
        "id": "l09-scene-01",
        "sha256": "14f2857f91cb82a85fa776a30a7926a297b564a0f086ae9afb344e78378a6be8",
        "printedPage": 62
      }
    ]
  },
  "textbook-l09-text-2": {
    "lesson": 9,
    "figures": [
      {
        "id": "l09-scene-02",
        "sha256": "aa84c86b92e0e0181067151ef9f2568e673249d84cca20da744d0ab333884416",
        "printedPage": 64
      }
    ]
  },
  "textbook-l09-text-3": {
    "lesson": 9,
    "figures": [
      {
        "id": "l09-scene-03",
        "sha256": "c5d154463b0b590a5d02873341a17b1a6eaf6f2e7df20a979baf470147eb18f5",
        "printedPage": 66
      }
    ]
  },
  "textbook-l10-text-1": {
    "lesson": 10,
    "figures": [
      {
        "id": "l10-scene-01",
        "sha256": "0bc9e8f0c1863427f3fa4bec0a65271dedbc9189289de09da62103b484661576",
        "printedPage": 71
      }
    ]
  },
  "textbook-l10-text-2": {
    "lesson": 10,
    "figures": [
      {
        "id": "l10-scene-02",
        "sha256": "455e50980f6d18dc6d6a49fde0d0a4af36ad68a79252958f12082d3c27318ad1",
        "printedPage": 73
      }
    ]
  },
  "textbook-l10-text-3": {
    "lesson": 10,
    "figures": [
      {
        "id": "l10-scene-03",
        "sha256": "7cea09ad5e7746c3f44f312552ca992f8aaf731aec0057a5eca718b968dff6e8",
        "printedPage": 74
      }
    ]
  },
  "textbook-l11-text-1": {
    "lesson": 11,
    "figures": [
      {
        "id": "l11-scene-01",
        "sha256": "47868320fbd302976d49d02539b41a43d2e6113ad32590f2c238dad6738ca192",
        "printedPage": 79
      }
    ]
  },
  "textbook-l11-text-2": {
    "lesson": 11,
    "figures": [
      {
        "id": "l11-scene-02",
        "sha256": "eb0c978527f83420e46dd726b95391a93391ee0b26fa6d3574bed5fa0ad2c68e",
        "printedPage": 81
      },
      {
        "id": "l11-scene-02-inset",
        "sha256": "4d8414932081574304a64b00531b87e3bb0e28aebe3f4afe72946b9c76c6c7dd",
        "printedPage": 81
      }
    ]
  },
  "textbook-l11-text-3": {
    "lesson": 11,
    "figures": [
      {
        "id": "l11-scene-03",
        "sha256": "d72d96c4af75fe31d87c5dfee014e8cd1549edbd3f226fd30e36989abc43460c",
        "printedPage": 83
      },
      {
        "id": "l11-scene-03-inset",
        "sha256": "1d4b7069cf728877d2ae32ed43f22f24ffd41c4f4fec9ea3a86b1d94760f2cca",
        "printedPage": 83
      }
    ]
  },
  "textbook-l12-text-1": {
    "lesson": 12,
    "figures": [
      {
        "id": "l12-text-1-photo",
        "sha256": "550d00fa521a47d9edeea38c1c6ca8850e588e64b593dd1ba868e1d6469e5e08",
        "printedPage": 87
      }
    ]
  },
  "textbook-l12-text-2": {
    "lesson": 12,
    "figures": [
      {
        "id": "l12-text-2-photo",
        "sha256": "a8cba159d546a6a84eb9b53c15fc0b9c82a5a13f3763cc75d219b2e7cad3dd9b",
        "printedPage": 89
      }
    ]
  },
  "textbook-l12-text-3": {
    "lesson": 12,
    "figures": [
      {
        "id": "l12-text-3-photo",
        "sha256": "38a036c9d37a060f47cc0d47b898a126280a8d46d89e81a2174059604b1e4fda",
        "printedPage": 91
      }
    ]
  },
  "textbook-l13-text-1": {
    "lesson": 13,
    "figures": [
      {
        "id": "l13-text-1-photo",
        "sha256": "5f253295dc41f058a4a8c683a033786812958e1beb782c540fe646470bc31341",
        "printedPage": 96
      }
    ]
  },
  "textbook-l13-text-2": {
    "lesson": 13,
    "figures": [
      {
        "id": "l13-text-2-photo",
        "sha256": "9933af56ed8b6d58b277b3e62a8e8f2e1a4245fe4e9eff1cb887127f920a8159",
        "printedPage": 98
      }
    ]
  },
  "textbook-l13-text-3": {
    "lesson": 13,
    "figures": [
      {
        "id": "l13-text-3-photo",
        "sha256": "303bcee67b2b95f2e0447b81e202bc8c93067b3230d3e15c55d6bd31eabe5a8d",
        "printedPage": 100
      }
    ]
  },
  "textbook-l14-text-1": {
    "lesson": 14,
    "figures": [
      {
        "id": "l14-text-1-photo",
        "sha256": "25bea16a08a0e80e5d1a4089af3c191f15fe2798e1a4898f841aed7bf16d33ef",
        "printedPage": 104
      }
    ]
  },
  "textbook-l14-text-2": {
    "lesson": 14,
    "figures": [
      {
        "id": "l14-text-2-photo",
        "sha256": "727034c22e00e2166d05802731c83d5a69e123c9c4d451b48a98331e041a4f11",
        "printedPage": 106
      }
    ]
  },
  "textbook-l14-text-3": {
    "lesson": 14,
    "figures": [
      {
        "id": "l14-text-3-photo",
        "sha256": "da2742c6476a0a59794cef90bff3aad3e22d9dba4a3c50a0d81a523faeee0b9a",
        "printedPage": 108
      }
    ]
  },
  "textbook-l15-text-1": {
    "lesson": 15,
    "figures": [
      {
        "id": "l15-text-1-photo",
        "sha256": "979e7aaadc62fc8f48e2196c11816f6f00bcb90be146dbcc565c484f860f7d17",
        "printedPage": 113
      }
    ]
  },
  "textbook-l15-text-2": {
    "lesson": 15,
    "figures": [
      {
        "id": "l15-text-2-photo",
        "sha256": "eedc5efd92e1bd98116571b14fdbbadfa93d81bafd98eae3c1eb48cbb75e3c1f",
        "printedPage": 115
      }
    ]
  },
  "textbook-l15-text-3": {
    "lesson": 15,
    "figures": [
      {
        "id": "l15-text-3-photo",
        "sha256": "178b9fd82aff164b455030c0e37dbf49ba218e63a0ba9307ef254cac7d50d0e2",
        "printedPage": 116
      }
    ]
  }
} as const;

export function resolveSceneFigureBindings(source:SourceLesson|undefined,sceneId:string):readonly SourceFigure[]{
  const binding=sceneFigureBindings[sceneId as keyof typeof sceneFigureBindings];
  if(!binding||!source||binding.lesson!==source.lesson||source.textbookSHA256!==textbookSHA256)return [];
  return binding.figures.flatMap(expected=>{
    const figure=source.figures.find(figure=>figure.id===expected.id);
    return figure&&figure.kind==='original-crop'&&figure.sha256===expected.sha256&&
      figure.source.textbookSHA256===textbookSHA256&&figure.source.printedPage===expected.printedPage&&
      figure.source.pdfPage===expected.printedPage+15&&sourceFigureAssetPath(figure)?[figure]:[];
  });
}

export function sceneFigures(lessonId:number,sceneId:string,officialVi?:OfficialViRegistry):readonly SourceFigure[]{
  const binding=sceneFigureBindings[sceneId as keyof typeof sceneFigureBindings];
  return binding?.lesson===lessonId?resolveSceneFigureBindings(getSourceLesson(lessonId,officialVi),sceneId):[];
}
