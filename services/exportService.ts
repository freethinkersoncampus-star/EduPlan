
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import { SOWRow, LessonPlan, UserProfile } from '../types';

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

export const exportSOWToDocx = async (sow: SOWRow[], meta: any, profile: UserProfile) => {
  const tableHeader = new TableRow({
    children: [
      "Wk", "Lsn", "Date", "Strand", "Sub Strand", "Outcomes", "Experiences", "Resources", "Assessment"
    ].map(text => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
      shading: { fill: "F3F4F6" },
      borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE }
    }))
  });

  const tableRows = sow.map(r => new TableRow({
    children: [
      r.isBreak ? "-" : r.week.toString(),
      r.isBreak ? "-" : r.lesson.toString(),
      r.date || "-",
      r.strand,
      r.subStrand,
      r.learningOutcomes,
      r.teachingExperiences,
      r.learningResources,
      r.assessmentMethods
    ].map(text => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 16 })] })],
      borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE }
    }))
  }));

  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: profile.school || "KICD MASTER SCHOOL", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: `${meta.year} RATIONALIZED ${meta.subject.toUpperCase()} ${meta.grade.toUpperCase()} SCHEMES OF WORK`, bold: true, size: 28, underline: {} })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `TERM ${meta.term} | DURATION: ${meta.termStart} - ${meta.termEnd} | HALF-TERM: ${meta.halfTermStart} - ${meta.halfTermEnd}`, size: 18, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tableHeader, ...tableRows]
        }),
        new Paragraph({
          children: [new TextRun({ text: "\n\n", size: 20 })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Teacher Signature: _______________________      ", size: 20 }),
            new TextRun({ text: "HOD Signature: _______________________      ", size: 20 }),
            new TextRun({ text: "Date: _______________________", size: 20 }),
          ],
          alignment: AlignmentType.CENTER,
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${meta.subject}_Grade${meta.grade}_Term${meta.term}_SOW.docx`);
};

export const exportLessonPlanToDocx = async (plan: LessonPlan, profile: UserProfile) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: profile.school || "KICD MASTER SCHOOL", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: `RATIONALIZED LESSON PLAN: ${plan.learningArea}`, bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Grade: ${plan.grade} | Term: ${plan.term} | Date: ${plan.date || '____/____/2026'}`, size: 20, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({ children: [new TextRun({ text: `Strand: ${plan.strand}`, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: `Sub-Strand: ${plan.subStrand}`, bold: true })], spacing: { after: 200 } }),
        
        new Paragraph({ children: [new TextRun({ text: "Learning Outcomes:", bold: true })], spacing: { before: 200 } }),
        ...plan.outcomes.map(o => new Paragraph({ children: [new TextRun({ text: `• ${o}` })], indent: { left: 720 } })),

        new Paragraph({ children: [new TextRun({ text: "Lesson Development:", bold: true })], spacing: { before: 400 } }),
        ...plan.lessonDevelopment.map((step, i) => [
          new Paragraph({ children: [new TextRun({ text: `Step ${i + 1}: ${step.title} (${step.duration})`, bold: true })], spacing: { before: 200 } }),
          ...step.content.map(c => new Paragraph({ children: [new TextRun({ text: `• ${c}` })], indent: { left: 720 } }))
        ]).flat(),

        new Paragraph({ children: [new TextRun({ text: "Conclusion:", bold: true })], spacing: { before: 400 } }),
        ...plan.conclusion.map(c => new Paragraph({ children: [new TextRun({ text: `• ${c}` })], indent: { left: 720 } }))
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${plan.learningArea}_${plan.subStrand}_LessonPlan.docx`);
};

export const exportNotesToDocx = async (title: string, content: string) => {
  const lines = content.split('\n');
  const children = [
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    ...lines.map(line => {
      const isHeader = line.startsWith('#');
      const text = line.replace(/#/g, '').trim();
      return new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: isHeader ? 24 : 20 })],
        spacing: { before: isHeader ? 200 : 100 }
      });
    })
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}_StudyNotes.docx`);
};
