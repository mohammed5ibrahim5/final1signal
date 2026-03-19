import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Point1Transform } from "@/components/tools/Point1Transform";
import { Point2OddEven } from "@/components/tools/Point2OddEven";
import { Point3Basic } from "@/components/tools/Point3Basic";
import { Point4Sinusoids } from "@/components/tools/Point4Sinusoids";
import { Point5EnergyPower } from "@/components/tools/Point5EnergyPower";
import { Point6Convolution } from "@/components/tools/Point6Convolution";
import { Point7Fourier } from "@/components/tools/Point7Fourier";
import { Point8Sampling } from "@/components/tools/Point8Sampling";
import { Point9ZTransform } from "@/components/tools/Point9ZTransform";
import { Point10Report } from "@/components/tools/Point10Report";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [activePoint, setActivePoint] = useState(1);

  const renderActivePoint = () => {
    switch (activePoint) {
      case 1: return <Point1Transform key="p1" />;
      case 2: return <Point2OddEven key="p2" />;
      case 3: return <Point3Basic key="p3" />;
      case 4: return <Point4Sinusoids key="p4" />;
      case 5: return <Point5EnergyPower key="p5" />;
      case 6: return <Point6Convolution key="p6" />;
      case 7: return <Point7Fourier key="p7" />;
      case 8: return <Point8Sampling key="p8" />;
      case 9: return <Point9ZTransform key="p9" />;
      case 10: return <Point10Report key="p10" />;
      default: return <Point1Transform key="p1" />;
    }
  };

  return (
    <Layout activePoint={activePoint} setActivePoint={setActivePoint}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePoint}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderActivePoint()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

