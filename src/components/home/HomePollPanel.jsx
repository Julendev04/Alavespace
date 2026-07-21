import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Plus, X } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const demoPoll = {
  id: "demo",
  question: "Ficharias a Greenwood?",
  votes_count: 29,
  options: [
    { id: "demo-1", label: "No, jamas (razones extradeportivas)", votes_count: 45 },
    { id: "demo-2", label: "Si", votes_count: 55 },
    { id: "demo-3", label: "No, pero por razones deportivas", votes_count: 0 }
  ]
};

export default function HomePollPanel() {
  const [poll, setPoll] = useState(demoPoll);
  const [selectedOption, setSelectedOption] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [pollForm, setPollForm] = useState({
    question: "",
    options: ["", "", ""]
  });

  const fetchPoll = async () => {
    const { data, error } = await supabase
      .from("polls")
      .select("id, question, votes_count, poll_options(id, label, votes_count, sort_order)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    const sortedOptions = (data.poll_options || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const { data: votesData } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", data.id);

    const votesByOption = new Map();
    (votesData || []).forEach((vote) => {
      votesByOption.set(vote.option_id, (votesByOption.get(vote.option_id) || 0) + 1);
    });

    const hasLiveVotes = Array.isArray(votesData);
    const options = sortedOptions.map((option) => ({
      id: option.id,
      label: option.label,
      votes_count: hasLiveVotes ? (votesByOption.get(option.id) || 0) : (option.votes_count || 0)
    }));

    setPoll({
      id: data.id,
      question: data.question,
      votes_count: hasLiveVotes
        ? options.reduce((total, option) => total + option.votes_count, 0)
        : (data.votes_count || 0),
      options
    });
    setSelectedOption("");
    setHasVoted(false);
  };

  useEffect(() => {
    let isMounted = true;

    const initPoll = async () => {
      await fetchPoll();

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || !isMounted) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (isMounted) setIsAdmin(profile?.role === "admin");
    };

    initPoll();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalVotes = useMemo(
    () => poll.options.reduce((total, option) => total + (option.votes_count || 0), 0),
    [poll.options]
  );

  const getPercent = (votes) => {
    if (!totalVotes) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleVote = async () => {
    if (!selectedOption || hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    const { data: authData } = await supabase.auth.getUser();

    if (poll.id !== "demo") {
      if (!authData?.user) {
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("poll_votes").insert({
        poll_id: poll.id,
        option_id: selectedOption,
        user_id: authData.user.id
      });

      if (error) {
        setIsSubmitting(false);
        return;
      }
    }

    setPoll((current) => ({
      ...current,
      votes_count: (current.votes_count || 0) + 1,
      options: current.options.map((option) => (
        option.id === selectedOption
          ? { ...option, votes_count: (option.votes_count || 0) + 1 }
          : option
      ))
    }));
    setHasVoted(true);
    setIsSubmitting(false);
  };

  const updateOption = (index, value) => {
    setPollForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index ? value : option
      ))
    }));
  };

  const handleCreatePoll = async (event) => {
    event.preventDefault();
    setAdminMessage("");

    const cleanQuestion = pollForm.question.trim();
    const cleanOptions = pollForm.options
      .map((option) => option.trim())
      .filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) {
      setAdminMessage("Anade una pregunta y al menos dos opciones.");
      return;
    }

    setIsSubmitting(true);

    await supabase
      .from("polls")
      .update({ is_active: false })
      .eq("is_active", true);

    const { data: newPoll, error: pollError } = await supabase
      .from("polls")
      .insert({ question: cleanQuestion, is_active: true })
      .select("id")
      .single();

    if (pollError || !newPoll) {
      setAdminMessage("No se pudo crear la encuesta.");
      setIsSubmitting(false);
      return;
    }

    const { error: optionsError } = await supabase.from("poll_options").insert(
      cleanOptions.map((label, index) => ({
        poll_id: newPoll.id,
        label,
        sort_order: index + 1
      }))
    );

    if (optionsError) {
      setAdminMessage("Encuesta creada, pero fallaron las opciones.");
      setIsSubmitting(false);
      return;
    }

    setPollForm({ question: "", options: ["", "", ""] });
    setIsAdminOpen(false);
    setIsSubmitting(false);
    await fetchPoll();
  };

  return (
    <section className="home-poll-panel" aria-label="Encuesta activa">
      <div className="home-poll-card">
        <div className="home-poll-topline">
          <span className="home-poll-kicker">Encuesta activa</span>
          {isAdmin && (
            <button
              type="button"
              className="home-poll-admin-toggle"
              onClick={() => setIsAdminOpen((current) => !current)}
            >
              {isAdminOpen ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
              {isAdminOpen ? "Cerrar" : "Nueva encuesta"}
            </button>
          )}
        </div>

        {isAdminOpen ? (
          <form className="home-poll-admin-form" onSubmit={handleCreatePoll}>
            <input
              type="text"
              value={pollForm.question}
              onChange={(event) => setPollForm((current) => ({ ...current, question: event.target.value }))}
              placeholder="Pregunta de la encuesta"
            />
            <div className="home-poll-admin-options">
              {pollForm.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Opcion ${index + 1}`}
                />
              ))}
            </div>
            {adminMessage && <span className="home-poll-admin-message">{adminMessage}</span>}
            <button type="submit" className="home-poll-vote" disabled={isSubmitting}>
              Crear encuesta
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <>
            <h3>{poll.question}</h3>

            <div className="home-poll-options">
              {poll.options.map((option) => {
                const percent = getPercent(option.votes_count || 0);
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`home-poll-option ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedOption(option.id)}
                    disabled={hasVoted}
                  >
                    <span className="home-poll-option-head">
                      <span>{option.label}</span>
                      <strong>{percent}%</strong>
                    </span>
                    <span className="home-poll-track">
                      <span style={{ width: `${percent}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="home-poll-footer">
              <span>{poll.votes_count || totalVotes} votos</span>
              {hasVoted && (
                <strong>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Voto registrado
                </strong>
              )}
            </div>

            <button
              type="button"
              className="home-poll-vote"
              onClick={handleVote}
              disabled={!selectedOption || hasVoted || isSubmitting}
            >
              {hasVoted ? "Gracias por votar" : "Votar en la encuesta"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
