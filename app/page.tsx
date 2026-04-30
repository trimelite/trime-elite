import Nav from "./components/Nav";
import Hero from "./components/Hero";
import AgentGrid from "./components/AgentGrid";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <Hero />
        <AgentGrid />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
