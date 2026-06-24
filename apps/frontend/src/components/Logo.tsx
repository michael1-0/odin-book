type LogoProps = {
  isBig?: boolean;
};

function Logo({ isBig = false }: LogoProps) {
  if (isBig) {
    return (
      <h2 className="mt-6 text-center text-5xl font-light tracking-tightest">
        <span className="font-bold">Ark</span>
      </h2>
    );
  }

  return <h1 className="text-4xl font-bold tracking-tightest">Ark</h1>;
}

export default Logo;
