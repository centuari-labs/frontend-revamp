import { CentuariInput } from "@/components/centuari-input";
import { CentuariInputExample } from "@/components/centuari-input-example";
import { Search, X } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CentuariInputExample />
        <div className="grid grid-cols-3 gap-2">
          <CentuariInput
            id="search"
            label="Search Small"
            size="small"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
          />
          <CentuariInput
            id="search"
            label="Search Medium"
            size="medium"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
          />
          <CentuariInput
            id="search"
            label="Search Large"
            size="large"
            placeholder="Search something"
            leftIcon={<Search size={16} />}
            rightIcon={<X size={16} />}
            helperText="This is a helper text."
          />
        </div>
      </div>
    </main>
  );
}
